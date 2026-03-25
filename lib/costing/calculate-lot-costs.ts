import { ProrationMethod, type Import, type ImportExpense, type ImportExpenseAllocation, type ImportItem, type ItemProduction } from '@prisma/client'

type ItemWithProduction = ImportItem & { production: ItemProduction | null }
type ExpenseWithAllocations = ImportExpense & { allocations: ImportExpenseAllocation[] }

type ImportWithRelations = Import & {
  items: ItemWithProduction[]
  expenses: ExpenseWithAllocations[]
}

export type RecalculatedItemCost = {
  itemId: string
  itemCode: string
  baseValueUsd: number
  freightAllocatedUsd: number
  otherExpensesAllocatedUsd: number
  totalAllocatedExpensesUsd: number
  totalItemCostUsd: number
  costPerProducedUnitUsd: number | null
  costPerSellableUnitUsd: number | null
  costPerExportableKgUsd: number | null
  adjustedRealCostUsd: number | null
  finalWasteKg: number | null
  participationByValuePct: number
  participationByNetWeightPct: number
  participationByGrossWeightPct: number
  participationByQuantityPct: number
}

export type RecalculatedImportCost = {
  subtotalGoodsUsd: number
  importTotalUsd: number
  totalNetWeightKg: number
  totalGrossWeightKg: number
  totalQuantity: number
  totalAdditionalExpenses: number
  totalInvestedUsd: number
  totalProducedUnits: number
  totalSellableUnits: number
  totalTheoreticalKg: number
  weightedSellableUnitCost: number
  items: RecalculatedItemCost[]
}

const round = (value: number, decimals = 4) => Number(value.toFixed(decimals))
const dec = (value: unknown) => Number(value ?? 0)

function safeRatio(value: number, total: number) {
  if (total <= 0) return 0
  return value / total
}

function getItemBasis(item: ImportItem, method: ProrationMethod) {
  if (method === 'POR_PESO_NETO') return dec(item.netWeightKg)
  if (method === 'POR_PESO_BRUTO') return dec(item.grossWeightKg)
  if (method === 'POR_CANTIDAD') return dec(item.quantity)
  return dec(item.totalValueUsd)
}

function allocateAmount(items: ImportItem[], amount: number, method: ProrationMethod) {
  const basis = items.map((item) => ({ itemId: item.id, basis: getItemBasis(item, method) }))
  const totalBasis = basis.reduce((sum, row) => sum + row.basis, 0)
  if (items.length === 0) return new Map<string, number>()

  if (method === 'MANUAL') return new Map<string, number>()

  const map = new Map<string, number>()
  let accumulated = 0

  basis.forEach((row, index) => {
    if (index === basis.length - 1) {
      map.set(row.itemId, round(amount - accumulated, 2))
      return
    }

    const allocation = totalBasis > 0 ? round((amount * row.basis) / totalBasis, 2) : round(amount / items.length, 2)
    accumulated += allocation
    map.set(row.itemId, allocation)
  })

  return map
}

export function calculateImportCosts(importData: ImportWithRelations): RecalculatedImportCost {
  const items = importData.items
  const subtotalGoodsUsd = round(items.reduce((sum, item) => sum + dec(item.totalValueUsd), 0), 2)
  const totalNetWeightKg = round(items.reduce((sum, item) => sum + dec(item.netWeightKg), 0), 2)
  const totalGrossWeightKg = round(items.reduce((sum, item) => sum + dec(item.grossWeightKg), 0), 2)
  const totalQuantity = round(items.reduce((sum, item) => sum + dec(item.quantity), 0), 2)

  const freightAllocation = allocateAmount(items, dec(importData.freightUsd), importData.freightProrationMethod)
  const manualAllocations = new Map<string, number>()
  const automaticAllocations = new Map<string, number>()

  importData.expenses.forEach((expense) => {
    if (expense.prorationMethod === 'MANUAL') {
      expense.allocations.forEach((alloc) => {
        manualAllocations.set(alloc.importItemId, (manualAllocations.get(alloc.importItemId) ?? 0) + dec(alloc.amountUsd))
      })
      return
    }

    const perExpense = allocateAmount(items, dec(expense.amountUsd), expense.prorationMethod)
    perExpense.forEach((amount, itemId) => {
      automaticAllocations.set(itemId, (automaticAllocations.get(itemId) ?? 0) + amount)
    })
  })

  const totalAdditionalExpenses = round(importData.expenses.reduce((sum, expense) => sum + dec(expense.amountUsd), 0), 2)
  const totalInvestedUsd = round(subtotalGoodsUsd + dec(importData.freightUsd) + totalAdditionalExpenses, 2)
  const importTotalUsd = round(subtotalGoodsUsd + dec(importData.freightUsd), 2)

  let totalProducedUnits = 0
  let totalSellableUnits = 0
  let totalTheoreticalKg = 0

  const itemCosts = items.map((item) => {
    const production = item.production
    const produced = production?.producedUnits ?? 0
    const sellable = production?.sellableUnits ?? 0
    const theoreticalKg = dec(production?.theoreticalExportWeightKg)
    totalProducedUnits += produced
    totalSellableUnits += sellable
    totalTheoreticalKg += theoreticalKg

    const freightAllocatedUsd = freightAllocation.get(item.id) ?? 0
    const otherExpensesAllocatedUsd = round((manualAllocations.get(item.id) ?? 0) + (automaticAllocations.get(item.id) ?? 0), 2)
    const totalAllocatedExpensesUsd = round(freightAllocatedUsd + otherExpensesAllocatedUsd, 2)
    const totalItemCostUsd = round(dec(item.totalValueUsd) + totalAllocatedExpensesUsd, 2)

    const costPerProducedUnitUsd = produced > 0 ? round(totalItemCostUsd / produced) : null
    const costPerSellableUnitUsd = sellable > 0 ? round(totalItemCostUsd / sellable) : null
    const costPerExportableKgUsd = theoreticalKg > 0 ? round(totalItemCostUsd / theoreticalKg) : null

    return {
      itemId: item.id,
      itemCode: item.itemCode,
      baseValueUsd: dec(item.totalValueUsd),
      freightAllocatedUsd: round(freightAllocatedUsd, 2),
      otherExpensesAllocatedUsd,
      totalAllocatedExpensesUsd,
      totalItemCostUsd,
      costPerProducedUnitUsd,
      costPerSellableUnitUsd,
      costPerExportableKgUsd,
      adjustedRealCostUsd: costPerSellableUnitUsd,
      finalWasteKg: production ? dec(production.finalWasteKg) : null,
      participationByValuePct: round(safeRatio(dec(item.totalValueUsd), subtotalGoodsUsd), 6),
      participationByNetWeightPct: round(safeRatio(dec(item.netWeightKg), totalNetWeightKg), 6),
      participationByGrossWeightPct: round(safeRatio(dec(item.grossWeightKg), totalGrossWeightKg), 6),
      participationByQuantityPct: round(safeRatio(dec(item.quantity), totalQuantity), 6),
    }
  })

  return {
    subtotalGoodsUsd,
    importTotalUsd,
    totalNetWeightKg,
    totalGrossWeightKg,
    totalQuantity,
    totalAdditionalExpenses,
    totalInvestedUsd,
    totalProducedUnits,
    totalSellableUnits,
    totalTheoreticalKg: round(totalTheoreticalKg, 4),
    weightedSellableUnitCost: totalSellableUnits > 0 ? round(totalInvestedUsd / totalSellableUnits) : 0,
    items: itemCosts,
  }
}

export function computeProductionFields(input: {
  producedUnits: number
  defectiveUnits: number
  grammageValue: number
  grammageUnit: 'GRAMOS' | 'KG'
  netWeightKg: number
  manualWasteAdjustmentKg: number
  unitsPerBundle?: number | null
  bundleCount?: number | null
}) {
  if (input.producedUnits < 0 || input.defectiveUnits < 0) throw new Error('No se permiten unidades negativas.')
  if (input.defectiveUnits > input.producedUnits) throw new Error('Las unidades defectuosas no pueden exceder las confeccionadas.')
  if (input.grammageValue < 0 || input.netWeightKg < 0) throw new Error('No se permiten pesos o gramajes negativos.')

  const grammageKg = input.grammageUnit === 'GRAMOS' ? input.grammageValue / 1000 : input.grammageValue
  const sellableUnits = input.producedUnits - input.defectiveUnits
  const theoreticalExportWeightKg = round(input.producedUnits * grammageKg, 4)
  const calculatedWasteKg = round(input.netWeightKg - theoreticalExportWeightKg, 4)
  const finalWasteKg = round(calculatedWasteKg + input.manualWasteAdjustmentKg, 4)

  return {
    sellableUnits,
    grammageKg: round(grammageKg, 6),
    theoreticalExportWeightKg,
    calculatedWasteKg,
    finalWasteKg,
    estimatedUnitsByBundle: input.unitsPerBundle && input.bundleCount ? input.unitsPerBundle * input.bundleCount : null,
  }
}
