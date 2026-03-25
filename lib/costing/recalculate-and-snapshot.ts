import { prisma } from '@/lib/prisma'
import { calculateImportCosts } from './calculate-lot-costs'

async function getImportCostView(importId: string) {
  return prisma.import.findUnique({
    where: { id: importId },
    include: {
      items: { include: { production: true } },
      expenses: { include: { allocations: true } },
      snapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
  })
}

export async function recalculateAndSnapshot(importId: string, reason: string) {
  const importData = await getImportCostView(importId)
  if (!importData) return

  await prisma.$transaction(async (tx) => {
    const current = await tx.import.findUnique({
      where: { id: importId },
      include: {
        items: { include: { production: true } },
        expenses: { include: { allocations: true } },
        snapshots: { orderBy: { version: 'desc' }, take: 1 },
      },
    })

    if (!current) return
    const result = calculateImportCosts(current)

    await tx.import.update({
      where: { id: importId },
      data: {
        subtotalGoodsUsd: result.subtotalGoodsUsd,
        importTotalUsd: result.importTotalUsd,
        totalNetWeightKg: result.totalNetWeightKg,
        totalGrossWeightKg: result.totalGrossWeightKg,
        totalQuantity: result.totalQuantity,
        totalAdditionalExpenses: result.totalAdditionalExpenses,
        totalInvestedUsd: result.totalInvestedUsd,
      },
    })

    const version = (current.snapshots[0]?.version ?? 0) + 1
    const previousValues = current.snapshots[0]
      ? {
          totalInvestedUsd: Number(current.snapshots[0].totalInvestedUsd),
          weightedSellableUnitCost: Number(current.snapshots[0].weightedSellableUnitCost),
        }
      : undefined

    await tx.costSnapshot.create({
      data: {
        importId,
        version,
        reason,
        previousValues,
        newValues: {
          totalInvestedUsd: result.totalInvestedUsd,
          weightedSellableUnitCost: result.weightedSellableUnitCost,
        },
        subtotalGoodsUsd: result.subtotalGoodsUsd,
        freightUsd: Number(current.freightUsd),
        additionalExpensesUsd: result.totalAdditionalExpenses,
        totalInvestedUsd: result.totalInvestedUsd,
        totalItems: current.items.length,
        totalProducedUnits: result.totalProducedUnits,
        totalSellableUnits: result.totalSellableUnits,
        totalTheoreticalKg: result.totalTheoreticalKg,
        weightedSellableUnitCost: result.weightedSellableUnitCost,
        itemSnapshots: {
          create: result.items.map((item) => ({
            importItemId: item.itemId,
            itemCode: item.itemCode,
            baseValueUsd: item.baseValueUsd,
            freightAllocatedUsd: item.freightAllocatedUsd,
            otherExpensesAllocatedUsd: item.otherExpensesAllocatedUsd,
            totalAllocatedExpensesUsd: item.totalAllocatedExpensesUsd,
            totalItemCostUsd: item.totalItemCostUsd,
            costPerProducedUnitUsd: item.costPerProducedUnitUsd,
            costPerSellableUnitUsd: item.costPerSellableUnitUsd,
            costPerExportableKgUsd: item.costPerExportableKgUsd,
            adjustedRealCostUsd: item.adjustedRealCostUsd,
            finalWasteKg: item.finalWasteKg,
            participationByValuePct: item.participationByValuePct,
            participationByNetWeightPct: item.participationByNetWeightPct,
            participationByGrossWeightPct: item.participationByGrossWeightPct,
            participationByQuantityPct: item.participationByQuantityPct,
          })),
        },
      },
    })
  })
}
