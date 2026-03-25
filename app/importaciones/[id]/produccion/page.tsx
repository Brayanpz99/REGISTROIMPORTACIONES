import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { saveProductionAction } from '@/app/importaciones/actions'

export default async function ProduccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lot = await prisma.importLot.findUnique({ where: { id }, include: { production: true } })
  if (!lot) notFound()

  const action = saveProductionAction.bind(null, id)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Producción</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{lot.lotCode}</h1>
      </div>

      <form action={action} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="producedUnits">Total de cobijas producidas</label>
            <input id="producedUnits" name="producedUnits" type="number" min="1" defaultValue={lot.production?.producedUnits ?? ''} required />
          </div>
          <div>
            <label htmlFor="defectiveUnits">Unidades defectuosas</label>
            <input id="defectiveUnits" name="defectiveUnits" type="number" min="0" defaultValue={lot.production?.defectiveUnits ?? 0} required />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes">Notas</label>
            <textarea id="notes" name="notes" rows={4} defaultValue={lot.production?.notes ?? ''} />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Guardar producción</button>
        </div>
      </form>
    </div>
  )
}
