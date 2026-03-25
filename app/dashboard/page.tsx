import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ExpenseChart } from '@/components/charts/expense-chart'
import { CostTrendChart } from '@/components/charts/cost-trend-chart'
import { formatUsd } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

export default async function DashboardPage() {
  const lots = await prisma.importLot.findMany({
    include: {
      expenses: true,
      production: true,
      costSnapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { date: 'desc' },
  })

  const totalInvested = lots.reduce((sum, lot) => sum + Number(lot.costSnapshots[0]?.totalInvestedUsd ?? 0), 0)
  const totalExpenses = lots.reduce((sum, lot) => sum + lot.expenses.reduce((acc, item) => acc + Number(item.amountUsd), 0), 0)
  const totalProduced = lots.reduce((sum, lot) => sum + (lot.production?.producedUnits ?? 0), 0)
  const totalDefective = lots.reduce((sum, lot) => sum + (lot.production?.defectiveUnits ?? 0), 0)

  const expenseMap = new Map<string, number>()
  lots.forEach((lot) => {
    lot.expenses.forEach((expense) => {
      expenseMap.set(expense.category, (expenseMap.get(expense.category) ?? 0) + Number(expense.amountUsd))
    })
  })

  const expenseChartData = Array.from(expenseMap.entries()).map(([name, value]) => ({ name, value }))
  const trendData = lots
    .filter((lot) => lot.costSnapshots[0])
    .map((lot) => ({ lotCode: lot.lotCode, adjustedRealUnitCost: Number(lot.costSnapshots[0]?.adjustedRealUnitCost ?? 0) }))
    .reverse()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Resumen general</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Dashboard de costos</h1>
          <p className="mt-2 text-slate-500">Tu vista rápida para saber cuánto está costando realmente cada lote.</p>
        </div>
        <Link href="/importaciones/nueva" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Nueva importación</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total invertido" value={formatUsd(totalInvested)} />
        <KpiCard title="Total gastos" value={formatUsd(totalExpenses)} />
        <KpiCard title="Producción total" value={String(totalProduced)} />
        <KpiCard title="Defectuosas" value={String(totalDefective)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ExpenseChart data={expenseChartData.length ? expenseChartData : [{ name: 'Sin datos', value: 0 }]} />
        <CostTrendChart data={trendData.length ? trendData : [{ lotCode: 'N/A', adjustedRealUnitCost: 0 }]} />
      </div>

      <div className="table-card">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">Últimos lotes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4">Lote</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Invertido</th>
                <th className="px-6 py-4">Costo real</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id} className="border-t border-slate-100">
                  <td className="px-6 py-4"><Link href={`/importaciones/${lot.id}`} className="font-semibold text-slate-950 hover:underline">{lot.lotCode}</Link></td>
                  <td className="px-6 py-4">{formatDate(lot.date)}</td>
                  <td className="px-6 py-4">{lot.supplier}</td>
                  <td className="px-6 py-4">{formatUsd(Number(lot.costSnapshots[0]?.totalInvestedUsd ?? 0))}</td>
                  <td className="px-6 py-4">{lot.costSnapshots[0] ? formatUsd(Number(lot.costSnapshots[0].adjustedRealUnitCost)) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
