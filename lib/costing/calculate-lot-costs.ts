export type LotCostInput = {
  invoiceValueUsd: number
  freightUsd: number
  expenses: Array<{ amountUsd: number }>
  producedUnits: number
  defectiveUnits: number
}

export type LotCostResult = {
  importTotalUsd: number
  totalExpensesUsd: number
  totalInvestedUsd: number
  sellableUnits: number
  baseUnitCost: number
  totalUnitCost: number
  adjustedRealUnitCost: number
}

function round(value: number, decimals = 4) {
  return Number(value.toFixed(decimals))
}

export function calculateLotCosts(input: LotCostInput): LotCostResult {
  const importTotalUsd = input.invoiceValueUsd + input.freightUsd
  const totalExpensesUsd = input.expenses.reduce((sum, item) => sum + item.amountUsd, 0)
  const totalInvestedUsd = importTotalUsd + totalExpensesUsd
  const sellableUnits = input.producedUnits - input.defectiveUnits

  if (input.producedUnits <= 0) {
    throw new Error('La producción total debe ser mayor a cero.')
  }

  if (input.defectiveUnits < 0) {
    throw new Error('Las unidades defectuosas no pueden ser negativas.')
  }

  if (sellableUnits <= 0) {
    throw new Error('Las unidades vendibles deben ser mayores a cero.')
  }

  return {
    importTotalUsd: round(importTotalUsd, 2),
    totalExpensesUsd: round(totalExpensesUsd, 2),
    totalInvestedUsd: round(totalInvestedUsd, 2),
    sellableUnits,
    baseUnitCost: round(importTotalUsd / input.producedUnits),
    totalUnitCost: round(totalInvestedUsd / input.producedUnits),
    adjustedRealUnitCost: round(totalInvestedUsd / sellableUnits),
  }
}
