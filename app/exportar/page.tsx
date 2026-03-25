import { prisma } from '@/lib/prisma'
import { formatUsd } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

export default async function ExportarPage() {
  const imports = await prisma.import.findMany({ include: { snapshots: { orderBy: { version: 'desc' }, take: 1 }, items: true }, orderBy: { invoiceDate: 'desc' } })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Datos listos</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Vista para exportación</h1>
        <div className="mt-4"><a href="/api/export/xlsx" className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Descargar Excel</a></div>
      </div>

      <div className="table-card overflow-x-auto">
        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-6 py-4">Código</th><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Proveedor</th><th className="px-6 py-4">Subtotal</th><th className="px-6 py-4">Total invertido</th><th className="px-6 py-4">Ítems</th><th className="px-6 py-4">Costo vendible</th></tr></thead>
          <tbody>{imports.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-6 py-4">{row.code}</td><td className="px-6 py-4">{formatDate(row.invoiceDate)}</td><td className="px-6 py-4">{row.supplier}</td><td className="px-6 py-4">{formatUsd(Number(row.subtotalGoodsUsd))}</td><td className="px-6 py-4">{formatUsd(Number(row.totalInvestedUsd))}</td><td className="px-6 py-4">{row.items.length}</td><td className="px-6 py-4">{row.snapshots[0] ? formatUsd(Number(row.snapshots[0].weightedSellableUnitCost)) : '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
