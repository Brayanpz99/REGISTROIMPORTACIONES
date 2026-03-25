import { PrismaClient } from '@prisma/client'
import { calculateImportCosts } from './calculate-lot-costs'

export async function recalculateAndSnapshotForSeed(prisma: PrismaClient, importId: string, reason: string) {
  const record = await prisma.import.findUnique({
    where: { id: importId },
    include: {
      items: { include: { production: true } },
      expenses: { include: { allocations: true } },
      snapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
  })
  if (!record) return

  const result = calculateImportCosts(record)

  await prisma.import.update({
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

  await prisma.costSnapshot.create({
    data: {
      importId,
      version: (record.snapshots[0]?.version ?? 0) + 1,
      reason,
      subtotalGoodsUsd: result.subtotalGoodsUsd,
      freightUsd: Number(record.freightUsd),
      additionalExpensesUsd: result.totalAdditionalExpenses,
      totalInvestedUsd: result.totalInvestedUsd,
      totalItems: record.items.length,
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
}
