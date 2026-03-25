import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { saveItemProductionAction } from '@/app/importaciones/actions'

export default async function ProduccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await prisma.import.findUnique({ where: { id }, include: { items: { include: { production: true }, orderBy: { itemCode: 'asc' } } } })
  if (!data) notFound()

  return (
    <div className="space-y-8">
      <div><p className="text-sm font-medium text-slate-500">Producción por ítem</p><h1 className="text-4xl font-semibold tracking-tight text-slate-950">{data.code}</h1></div>
      <div className="space-y-6">
        {data.items.map((item) => {
          const action = saveItemProductionAction.bind(null, data.id, item.id)
          const p = item.production
          const warning = p?.estimatedUnitsByBundle && p.estimatedUnitsByBundle !== p.producedUnits
          return (
            <form key={item.id} action={action} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-950">{item.itemCode} · {item.description}</h2>
              <p className="text-sm text-slate-500">Peso neto importado: {Number(item.netWeightKg).toFixed(2)} kg</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div><label>Unidades confeccionadas</label><input name="producedUnits" type="number" min="0" defaultValue={p?.producedUnits ?? 0} required /></div>
                <div><label>Unidades defectuosas</label><input name="defectiveUnits" type="number" min="0" defaultValue={p?.defectiveUnits ?? 0} required /></div>
                <div><label>Gramaje por unidad</label><input name="grammageValue" type="number" min="0" step="0.0001" defaultValue={Number(p?.grammageValue ?? 0.89)} required /></div>
                <div><label>Unidad gramaje</label><select name="grammageUnit" defaultValue={p?.grammageUnit ?? 'KG'}><option value="KG">KG</option><option value="GRAMOS">GRAMOS</option></select></div>
                <div><label>Unidades por bulto</label><input name="unitsPerBundle" type="number" min="0" defaultValue={p?.unitsPerBundle ?? ''} /></div>
                <div><label>Cantidad bultos</label><input name="bundleCount" type="number" min="0" defaultValue={p?.bundleCount ?? ''} /></div>
                <div><label>Ajuste desperdicio (kg)</label><input name="manualWasteAdjustmentKg" type="number" step="0.0001" defaultValue={Number(p?.manualWasteAdjustmentKg ?? 0)} /></div>
                <div className="md:col-span-2"><label>Motivo ajuste</label><input name="wasteAdjustmentReason" defaultValue={p?.wasteAdjustmentReason ?? ''} /></div>
                <div className="md:col-span-3"><label>Observaciones</label><textarea name="notes" rows={2} defaultValue={p?.notes ?? ''} /></div>
              </div>
              {warning ? <p className="mt-4 text-sm text-amber-600">Advertencia: unidades por bultos no coincide con unidades confeccionadas.</p> : null}
              <div className="mt-5 flex justify-end"><button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Guardar producción del ítem</button></div>
            </form>
          )
        })}
      </div>
    </div>
  )
}
