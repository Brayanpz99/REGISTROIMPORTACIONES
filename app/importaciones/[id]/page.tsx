import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatUsd } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

export default async function ImportacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lot = await prisma.importLot.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: { expenseDate: 'desc' } },
      production: true,
      costSnapshots: { orderBy: { version: 'desc' } },
    },
  })

  if (!lot) notFound()

  const lastSnapshot = lot.costSnapshots[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Detalle de lote</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{lot.lotCode}</h1>
          <p className="mt-2 text-slate-500">Factura {lot.invoiceNumber} · {lot.supplier}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/importaciones/${lot.id}/gastos/nuevo`} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50">Agregar gasto</Link>
          <Link href={`/importaciones/${lot.id}/produccion`} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Registrar producción</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total importación" value={formatUsd(Number(lot.importTotalUsd))} subtitle={formatDate(lot.date)} />
        <Card title="Total gastos" value={formatUsd(Number(lastSnapshot?.totalExpensesUsd ?? 0))} subtitle={`${lot.expenses.length} gastos`} />
        <Card title="Total invertido" value={formatUsd(Number(lastSnapshot?.totalInvestedUsd ?? 0))} subtitle="Importación + gastos" />
        <Card title="Costo real ajustado" value={lastSnapshot ? formatUsd(Number(lastSnapshot.adjustedRealUnitCost)) : '-'} subtitle="Por unidad vendible" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="table-card">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">Gastos del lote</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">Pago</th>
                </tr>
              </thead>
              <tbody>
                {lot.expenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-slate-100">
                    <td className="px-6 py-4">{formatDate(expense.expenseDate)}</td>
                    <td className="px-6 py-4">{expense.category}</td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">{expense.provider}</td>
                    <td className="px-6 py-4">{formatUsd(Number(expense.amountUsd))}</td>
                    <td className="px-6 py-4">{expense.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">Producción</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <MiniCard label="Producidas" value={String(lot.production?.producedUnits ?? 0)} />
              <MiniCard label="Defectuosas" value={String(lot.production?.defectiveUnits ?? 0)} />
              <MiniCard label="Vendibles" value={String(lot.production?.sellableUnits ?? 0)} />
            </div>
            {lot.production?.notes ? <p className="mt-4 text-sm text-slate-500">{lot.production.notes}</p> : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">Versiones de costo</h2>
            <div className="mt-4 space-y-3">
              {lot.costSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">Versión {snapshot.version}</p>
                    <p className="text-xs text-slate-500">{formatDate(snapshot.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{snapshot.reason ?? 'Recalculado automático'}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniCard label="Costo base" value={formatUsd(Number(snapshot.baseUnitCost))} />
                    <MiniCard label="Costo total" value={formatUsd(Number(snapshot.totalUnitCost))} />
                    <MiniCard label="Costo real" value={formatUsd(Number(snapshot.adjustedRealUnitCost))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {subtitle ? <p className="mt-2 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  )
}
