import { PrismaClient, ExpenseCategory, PaymentMethod, PaymentStatus } from '@prisma/client'
import { recalculateAndSnapshotForSeed } from '../lib/costing/recalculate-seed'
import { computeProductionFields } from '../lib/costing/calculate-lot-costs'

const prisma = new PrismaClient()

async function main() {
  await prisma.itemCostSnapshot.deleteMany()
  await prisma.costSnapshot.deleteMany()
  await prisma.itemProduction.deleteMany()
  await prisma.importExpenseAllocation.deleteMany()
  await prisma.importExpense.deleteMany()
  await prisma.importItem.deleteMany()
  await prisma.import.deleteMany()

  const imp = await prisma.import.create({
    data: {
      code: 'IMP-00001',
      invoiceNumber: 'BZECU2601',
      invoiceDate: new Date('2026-03-26'),
      supplier: 'SHAOXING KENQIAO BINZHI TEXTILE CO., LTD',
      description: 'Importación de telas para confección de cobijas',
      currency: 'USD',
      freightUsd: 3000,
      freightProrationMethod: 'POR_PESO_NETO',
      notes: 'Seed demostrativo para costeo por ítem',
      items: {
        create: [
          {
            itemCode: 'COD001',
            description: 'Tela tipo 1',
            quantity: 23000,
            unit: 'METROS',
            unitPriceUsd: 1.709754,
            totalValueUsd: 39324.35,
            netWeightKg: 9100,
            grossWeightKg: 9400,
          },
          {
            itemCode: 'COD002',
            description: 'Tela tipo 2',
            quantity: 23814.7,
            unit: 'METROS',
            unitPriceUsd: 1.761245,
            totalValueUsd: 41961.66,
            netWeightKg: 9741.6,
            grossWeightKg: 10020,
          },
        ],
      },
    },
    include: { items: true },
  })

  await prisma.importExpense.createMany({
    data: [
      { importId: imp.id, category: ExpenseCategory.AGENCIA_ADUANA, description: 'Honorarios aduaneros', amountUsd: 1600, expenseDate: new Date('2026-03-27'), provider: 'Aduana Demo', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-28'), prorationMethod: 'POR_VALOR' },
      { importId: imp.id, category: ExpenseCategory.NAVIERA, description: 'Servicios naviera', amountUsd: 2400, expenseDate: new Date('2026-03-27'), provider: 'Naviera Demo', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-27'), prorationMethod: 'POR_PESO_BRUTO' },
      { importId: imp.id, category: ExpenseCategory.INSUMOS, description: 'Etiquetas e hilo', amountUsd: 900, expenseDate: new Date('2026-03-29'), provider: 'Insumos Norte', paymentStatus: PaymentStatus.PENDING, prorationMethod: 'MANUAL' },
    ],
  })

  const expenses = await prisma.importExpense.findMany({ where: { importId: imp.id } })
  const manualExpense = expenses.find((e) => e.prorationMethod === 'MANUAL')
  if (manualExpense) {
    const item1 = imp.items.find((i) => i.itemCode === 'COD001')!
    const item2 = imp.items.find((i) => i.itemCode === 'COD002')!
    await prisma.importExpenseAllocation.createMany({
      data: [
        { expenseId: manualExpense.id, importItemId: item1.id, amountUsd: 430, allocationPct: 0.477778, isManual: true },
        { expenseId: manualExpense.id, importItemId: item2.id, amountUsd: 470, allocationPct: 0.522222, isManual: true },
      ],
    })
  }

  const item1 = imp.items.find((i) => i.itemCode === 'COD001')!
  const item2 = imp.items.find((i) => i.itemCode === 'COD002')!

  const p1 = computeProductionFields({ producedUnits: 9800, defectiveUnits: 260, grammageValue: 0.89, grammageUnit: 'KG', netWeightKg: Number(item1.netWeightKg), manualWasteAdjustmentKg: 0, unitsPerBundle: 49, bundleCount: 200 })
  const p2 = computeProductionFields({ producedUnits: 10200, defectiveUnits: 310, grammageValue: 0.89, grammageUnit: 'KG', netWeightKg: Number(item2.netWeightKg), manualWasteAdjustmentKg: 0, unitsPerBundle: 51, bundleCount: 200 })

  await prisma.itemProduction.createMany({
    data: [
      {
        importItemId: item1.id,
        producedUnits: 9800,
        defectiveUnits: 260,
        sellableUnits: p1.sellableUnits,
        grammageValue: 0.89,
        grammageUnit: 'KG',
        grammageKg: p1.grammageKg,
        unitsPerBundle: 49,
        bundleCount: 200,
        estimatedUnitsByBundle: p1.estimatedUnitsByBundle,
        theoreticalExportWeightKg: p1.theoreticalExportWeightKg,
        calculatedWasteKg: p1.calculatedWasteKg,
        manualWasteAdjustmentKg: 0,
        finalWasteKg: p1.finalWasteKg,
      },
      {
        importItemId: item2.id,
        producedUnits: 10200,
        defectiveUnits: 310,
        sellableUnits: p2.sellableUnits,
        grammageValue: 0.89,
        grammageUnit: 'KG',
        grammageKg: p2.grammageKg,
        unitsPerBundle: 51,
        bundleCount: 200,
        estimatedUnitsByBundle: p2.estimatedUnitsByBundle,
        theoreticalExportWeightKg: p2.theoreticalExportWeightKg,
        calculatedWasteKg: p2.calculatedWasteKg,
        manualWasteAdjustmentKg: 0,
        finalWasteKg: p2.finalWasteKg,
      },
    ],
  })

  await recalculateAndSnapshotForSeed(prisma, imp.id, 'Carga inicial seed con modelo multi-ítem')
}

main().finally(async () => {
  await prisma.$disconnect()
})
