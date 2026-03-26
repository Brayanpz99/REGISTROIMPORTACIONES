import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ExpenseChart } from '@/components/charts/expense-chart'
import { CostTrendChart } from '@/components/charts/cost-trend-chart'
import { AlertList } from '@/components/dashboard/alert-list'
import { formatUsd } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { getInsurancePolicyState } from '@/lib/utils/insurance-policy'

export default async function DashboardPage() {
  const imports = await prisma.import.findMany({
    include: {
      expenses: true,
      items: { include: { production: true } },
      snapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { invoiceDate: 'desc' },
  })

  const totalInvested = imports.reduce((sum, row) => sum + Number(row.totalInvestedUsd), 0)
  const totalProduced = imports.reduce((sum, row) => sum + row.items.reduce((acc, item) => acc + (item.production?.producedUnits ?? 0), 0), 0)
  const totalWasteKg = imports.reduce((sum, row) => sum + row.items.reduce((acc, item) => acc + Number(item.production?.finalWasteKg ?? 0), 0), 0)
  const sellableCosts = imports.map((row) => Number(row.snapshots[0]?.weightedSellableUnitCost ?? 0)).filter((n) => n > 0)
  const avgSellableCost = sellableCosts.length ? sellableCosts.reduce((a, b) => a + b, 0) / sellableCosts.length : 0

  const expenseMap = new Map<string, number>()
  imports.forEach((row) => row.expenses.forEach((expense) => expenseMap.set(expense.category, (expenseMap.get(expense.category) ?? 0) + Number(expense.amountUsd))))
  const expenseChartData = Array.from(expenseMap.entries()).map(([name, value]) => ({ name, value }))

  const trendData = imports
    .filter((row) => row.snapshots[0])
    .map((row) => ({ lotCode: row.code, adjustedRealUnitCost: Number(row.snapshots[0].weightedSellableUnitCost) }))
    .reverse()

  const alerts = imports.flatMap((row) => {
    const produced = row.items.reduce((acc, item) => acc + (item.production?.producedUnits ?? 0), 0)
    const missingProd = row.items.filter((item) => !item.production).length
    const defective = row.items.reduce((acc, item) => acc + (item.production?.defectiveUnits ?? 0), 0)
    const defectRate = produced > 0 ? defective / produced : 0

    const policyState = getInsurancePolicyState(row.insuranceExpiresAt)

    return [
      !row.snapshots[0]
        ? { id: `${row.id}-snapshot`, title: `${row.code} sin snapshot`, description: 'Requiere recálculo para mostrar costo vendible.', severity: 'warning' as const }
        : null,
      missingProd > 0
        ? { id: `${row.id}-production`, title: `${row.code} con producción pendiente`, description: `${missingProd} ítem(s) aún sin producción registrada.`, severity: 'info' as const }
        : null,
      defectRate > 0.05
        ? { id: `${row.id}-defect`, title: `${row.code} con merma alta`, description: `La tasa de defectuosos es ${(defectRate * 100).toFixed(2)}%.`, severity: 'warning' as const }
        : null,
      policyState.status === 'warning' && policyState.daysRemaining !== null
        ? { id: `${row.id}-policy-warning`, title: `La póliza de ${row.code} vence en ${policyState.daysRemaining} días`, description: 'Revisar renovación para evitar vencimiento operativo.', severity: 'warning' as const }
        : null,
      policyState.status === 'expired'
        ? { id: `${row.id}-policy-expired`, title: `La póliza de ${row.code} está vencida`, description: 'Se requiere actualización inmediata de póliza.', severity: 'warning' as const }
        : null,
    ].filter((alert): alert is NonNullable<typeof alert> => Boolean(alert))
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Resumen gerencial</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Dashboard de costos por importación</h1>
          <p className="mt-2 text-slate-500">Vista tipo ERP para decisiones operativas y de costos.</p>
        </div>
        <Link href="/importaciones/nueva" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Nueva importación</Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total invertido" value={formatUsd(totalInvested)} />
        <KpiCard title="Costo vendible promedio" value={formatUsd(avgSellableCost)} />
        <KpiCard title="Unidades confeccionadas" value={String(totalProduced)} />
        <KpiCard title="Desperdicio total" value={`${totalWasteKg.toFixed(2)} kg`} />
      </section>

      <AlertList alerts={alerts} />

      <section className="grid gap-6 xl:grid-cols-2">
        <ExpenseChart data={expenseChartData.length ? expenseChartData : [{ name: 'Sin datos', value: 0 }]} />
        <CostTrendChart data={trendData.length ? trendData : [{ lotCode: 'N/A', adjustedRealUnitCost: 0 }]} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">Últimas importaciones</h2>
          <p className="text-sm text-slate-500">Seguimiento de estado y costo vendible por lote.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Invertido</th>
                <th className="px-6 py-4">Costo vendible</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-6 py-4"><Link href={`/importaciones/${row.id}`} className="font-semibold text-slate-950 hover:underline">{row.code}</Link></td>
                  <td className="px-6 py-4">{formatDate(row.invoiceDate)}</td>
                  <td className="px-6 py-4">{row.supplier}</td>
                  <td className="px-6 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{row.status}</span></td>
                  <td className="px-6 py-4">{formatUsd(Number(row.totalInvestedUsd))}</td>
                  <td className="px-6 py-4">{row.snapshots[0] ? formatUsd(Number(row.snapshots[0].weightedSellableUnitCost)) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
