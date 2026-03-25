import { prisma } from '@/lib/prisma'
import { calculateLotCosts } from './calculate-lot-costs'

export async function recalculateAndSnapshot(importLotId: string, reason: string) {
  const lot = await prisma.importLot.findUnique({
    where: { id: importLotId },
    include: {
      expenses: true,
      production: true,
      costSnapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
  })

  if (!lot || !lot.production) return

  const result = calculateLotCosts({
    invoiceValueUsd: Number(lot.invoiceValueUsd),
    freightUsd: Number(lot.freightUsd),
    expenses: lot.expenses.map((e) => ({ amountUsd: Number(e.amountUsd) })),
    producedUnits: lot.production.producedUnits,
    defectiveUnits: lot.production.defectiveUnits,
  })

  const currentVersion = lot.costSnapshots[0]?.version ?? 0

  await prisma.importLot.update({
    where: { id: importLotId },
    data: { importTotalUsd: result.importTotalUsd }
  })

  await prisma.costSnapshot.create({
    data: {
      importLotId,
      version: currentVersion + 1,
      baseUnitCost: result.baseUnitCost,
      totalUnitCost: result.totalUnitCost,
      adjustedRealUnitCost: result.adjustedRealUnitCost,
      totalExpensesUsd: result.totalExpensesUsd,
      totalInvestedUsd: result.totalInvestedUsd,
      producedUnits: lot.production.producedUnits,
      sellableUnits: result.sellableUnits,
      reason,
    },
  })
}
