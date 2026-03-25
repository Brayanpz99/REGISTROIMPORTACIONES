import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils/date'
import { formatUsd } from '@/lib/utils/currency'

export default async function ImportacionesPage() {
  const imports = await prisma.import.findMany({
    include: { snapshots: { orderBy: { version: 'desc' }, take: 1 }, items: true },
    orderBy: { invoiceDate: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-medium text-slate-500">Facturas</p><h1 className="text-4xl font-semibold tracking-tight text-slate-950">Importaciones</h1></div>
        <Link href="/importaciones/nueva" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Registrar importación</Link>
      </div>
      <div className="table-card overflow-x-auto">
        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-6 py-4">Código</th><th className="px-6 py-4">Factura</th><th className="px-6 py-4">Proveedor</th><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Ítems</th><th className="px-6 py-4">Subtotal</th><th className="px-6 py-4">Total invertido</th><th className="px-6 py-4">Costo vendible</th></tr></thead>
          <tbody>
            {imports.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-6 py-4"><Link href={`/importaciones/${row.id}`} className="font-semibold text-slate-950 hover:underline">{row.code}</Link></td>
                <td className="px-6 py-4">{row.invoiceNumber}</td>
                <td className="px-6 py-4">{row.supplier}</td>
                <td className="px-6 py-4">{formatDate(row.invoiceDate)}</td>
                <td className="px-6 py-4">{row.items.length}</td>
                <td className="px-6 py-4">{formatUsd(Number(row.subtotalGoodsUsd))}</td>
                <td className="px-6 py-4">{formatUsd(Number(row.totalInvestedUsd))}</td>
                <td className="px-6 py-4">{row.snapshots[0] ? formatUsd(Number(row.snapshots[0].weightedSellableUnitCost)) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
