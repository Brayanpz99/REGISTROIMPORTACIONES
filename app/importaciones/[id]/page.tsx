import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatUsd } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { deleteExpenseAction, deleteImportAction } from '@/app/importaciones/actions'
import { DetailTabs } from '@/components/importaciones/detail-tabs'

const pct = (value: number) => `${(value * 100).toFixed(2)}%`

export default async function ImportacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await prisma.import.findUnique({
    where: { id },
    include: {
      items: { include: { production: true }, orderBy: { itemCode: 'asc' } },
      expenses: { include: { allocations: { include: { importItem: true } } }, orderBy: { expenseDate: 'desc' } },
      snapshots: { include: { itemSnapshots: true }, orderBy: { version: 'desc' } },
    },
  })

  if (!data) notFound()

  const lastSnapshot = data.snapshots[0]
  const byItem = new Map(lastSnapshot?.itemSnapshots.map((i) => [i.importItemId, i]) ?? [])
  const deleteImport = deleteImportAction.bind(null, data.id)

  const producedUnits = data.items.reduce((sum, item) => sum + (item.production?.producedUnits ?? 0), 0)
  const sellableUnits = data.items.reduce((sum, item) => sum + (item.production?.sellableUnits ?? 0), 0)
  const producedWeightKg = data.items.reduce((sum, item) => sum + Number(item.production?.theoreticalExportWeightKg ?? 0), 0)
  const wasteKg = data.items.reduce((sum, item) => sum + Number(item.production?.finalWasteKg ?? 0), 0)

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Importación</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{data.code}</h1>
            <p className="mt-2 text-slate-600">Factura {data.invoiceNumber} · {data.supplier}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/importaciones/${data.id}/editar`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">Editar</Link>
            <Link href={`/importaciones/${data.id}/gastos/nuevo`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">Agregar gasto</Link>
            <Link href={`/importaciones/${data.id}/produccion`} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Producción por ítem</Link>
            <form action={deleteImport}><button className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Eliminar</button></form>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card title="Subtotal mercancía" value={formatUsd(Number(data.subtotalGoodsUsd))} subtitle={`Factura ${formatDate(data.invoiceDate)}`} />
        <Card title="Flete internacional" value={formatUsd(Number(data.freightUsd))} subtitle={data.freightProrationMethod} />
        <Card title="Total importación" value={formatUsd(Number(data.importTotalUsd))} subtitle="Mercancía + flete" />
        <Card title="Gastos adicionales" value={formatUsd(Number(data.totalAdditionalExpenses))} subtitle={`${data.expenses.length} gastos`} />
        <Card title="Total invertido" value={formatUsd(Number(data.totalInvestedUsd))} subtitle="Costo consolidado" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card title="Peso importado" value={`${Number(data.totalNetWeightKg).toFixed(2)} kg`} subtitle="Peso neto" />
        <Card title="Peso producido" value={`${producedWeightKg.toFixed(2)} kg`} subtitle="Teórico exportable" />
        <Card title="Desperdicio" value={`${wasteKg.toFixed(2)} kg`} subtitle="Final" />
        <Card title="Unidades confeccionadas" value={String(producedUnits)} subtitle="Producción total" />
        <Card title="Unidades vendibles" value={String(sellableUnits)} subtitle="Consolidado" />
      </section>

      <DetailTabs
        tabs={[
          {
            id: 'resumen',
            label: 'Resumen',
            content: (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                <div className="border-b border-slate-200 px-6 py-5"><h2 className="text-xl font-semibold text-slate-950">Ítems importados</h2></div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500"><tr>
                      <th className="px-6 py-4">Código</th><th className="px-6 py-4">Descripción</th><th className="px-6 py-4">Cantidad</th><th className="px-6 py-4">Precio</th><th className="px-6 py-4">Valor</th><th className="px-6 py-4">% Part.</th><th className="px-6 py-4">Costo total</th><th className="px-6 py-4">Costo/u conf.</th><th className="px-6 py-4">Costo/u vend.</th><th className="px-6 py-4">Costo/kg</th><th className="px-6 py-4">Desperdicio</th>
                    </tr></thead>
                    <tbody>
                      {data.items.map((item) => {
                        const snapshot = byItem.get(item.id)
                        return <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-6 py-4 font-semibold">{item.itemCode}</td>
                          <td className="px-6 py-4">{item.description}</td>
                          <td className="px-6 py-4">{Number(item.quantity).toFixed(2)} {item.unit}</td>
                          <td className="px-6 py-4">{formatUsd(Number(item.unitPriceUsd))}</td>
                          <td className="px-6 py-4">{formatUsd(Number(item.totalValueUsd))}</td>
                          <td className="px-6 py-4">{snapshot ? pct(Number(snapshot.participationByValuePct)) : '-'}</td>
                          <td className="px-6 py-4">{snapshot ? formatUsd(Number(snapshot.totalItemCostUsd)) : '-'}</td>
                          <td className="px-6 py-4">{snapshot?.costPerProducedUnitUsd ? formatUsd(Number(snapshot.costPerProducedUnitUsd)) : 'Pendiente'}</td>
                          <td className="px-6 py-4">{snapshot?.costPerSellableUnitUsd ? formatUsd(Number(snapshot.costPerSellableUnitUsd)) : 'Pendiente'}</td>
                          <td className="px-6 py-4">{snapshot?.costPerExportableKgUsd ? formatUsd(Number(snapshot.costPerExportableKgUsd)) : 'Pendiente'}</td>
                          <td className="px-6 py-4">{item.production ? `${Number(item.production.finalWasteKg).toFixed(2)} kg` : 'Pendiente'}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ),
          },
          {
            id: 'gastos',
            label: 'Gastos',
            content: (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                <div className="border-b border-slate-200 px-6 py-5"><h2 className="text-xl font-semibold text-slate-950">Gastos y prorrateo</h2></div>
                <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Método</th><th className="px-6 py-4">Monto</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Impacto</th><th className="px-6 py-4">Acciones</th></tr></thead><tbody>
                  {data.expenses.map((expense) => {
                    const remove = deleteExpenseAction.bind(null, data.id, expense.id)
                    return <tr key={expense.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">{formatDate(expense.expenseDate)}</td><td className="px-6 py-4">{expense.category}</td><td className="px-6 py-4">{expense.prorationMethod}</td><td className="px-6 py-4">{formatUsd(Number(expense.amountUsd))}</td><td className="px-6 py-4">{expense.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}</td><td className="px-6 py-4">{expense.allocations.length} asignaciones</td>
                      <td className="px-6 py-4"><form action={remove}><button className="text-rose-600 hover:underline">Eliminar</button></form></td>
                    </tr>
                  })}
                </tbody></table></div>
              </section>
            ),
          },
          {
            id: 'produccion',
            label: 'Producción',
            content: (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                    <h3 className="text-base font-semibold text-slate-950">{item.itemCode} · {item.description}</h3>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Confeccionadas: <span className="font-medium text-slate-900">{item.production?.producedUnits ?? 0}</span></p>
                      <p>Vendibles: <span className="font-medium text-slate-900">{item.production?.sellableUnits ?? 0}</span></p>
                      <p>Peso teórico: <span className="font-medium text-slate-900">{Number(item.production?.theoreticalExportWeightKg ?? 0).toFixed(2)} kg</span></p>
                      <p>Desperdicio final: <span className="font-medium text-slate-900">{Number(item.production?.finalWasteKg ?? 0).toFixed(2)} kg</span></p>
                    </div>
                  </article>
                ))}
              </section>
            ),
          },
          {
            id: 'historial',
            label: 'Historial',
            content: (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-950">Snapshots de costos</h2>
                <div className="mt-4 space-y-3">
                  {data.snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between"><p className="font-semibold">Versión {snapshot.version}</p><p className="text-xs text-slate-500">{formatDate(snapshot.createdAt)}</p></div>
                      <p className="text-sm text-slate-500">{snapshot.reason ?? 'Recálculo automático'}</p>
                      <p className="text-sm text-slate-500">Antes: {snapshot.previousValues ? JSON.stringify(snapshot.previousValues) : 'N/A'} | Después: {snapshot.newValues ? JSON.stringify(snapshot.newValues) : 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </section>
            ),
          },
        ]}
      />
    </div>
  )
}

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  )
}
