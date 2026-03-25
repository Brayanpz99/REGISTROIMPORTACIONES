import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils/date'
import { formatUsd } from '@/lib/utils/currency'

export default async function ImportacionesPage() {
  const lots = await prisma.importLot.findMany({
    include: {
      expenses: true,
      production: true,
      costSnapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { date: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Lotes</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Importaciones</h1>
        </div>
        <Link href="/importaciones/nueva" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Registrar lote</Link>
      </div>

      <div className="table-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-4">Lote</th>
              <th className="px-6 py-4">Factura</th>
              <th className="px-6 py-4">Proveedor</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Importación</th>
              <th className="px-6 py-4">Gastos</th>
              <th className="px-6 py-4">Costo real</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id} className="border-t border-slate-100">
                <td className="px-6 py-4"><Link href={`/importaciones/${lot.id}`} className="font-semibold text-slate-950 hover:underline">{lot.lotCode}</Link></td>
                <td className="px-6 py-4">{lot.invoiceNumber}</td>
                <td className="px-6 py-4">{lot.supplier}</td>
                <td className="px-6 py-4">{formatDate(lot.date)}</td>
                <td className="px-6 py-4">{formatUsd(Number(lot.importTotalUsd))}</td>
                <td className="px-6 py-4">{formatUsd(lot.expenses.reduce((sum, item) => sum + Number(item.amountUsd), 0))}</td>
                <td className="px-6 py-4">{lot.costSnapshots[0] ? formatUsd(Number(lot.costSnapshots[0].adjustedRealUnitCost)) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
