import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateImportAction } from '@/app/importaciones/actions'

export default async function EditarImportacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await prisma.import.findUnique({ where: { id }, include: { items: { orderBy: { itemCode: 'asc' } } } })
  if (!data) notFound()

  const action = updateImportAction.bind(null, id)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div><p className="text-sm font-medium text-slate-500">Editar importación</p><h1 className="text-4xl font-semibold tracking-tight text-slate-950">{data.code}</h1></div>
      <form action={action} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-3">
          <div><label>Número de factura</label><input name="invoiceNumber" defaultValue={data.invoiceNumber} required /></div>
          <div><label>Fecha factura</label><input name="invoiceDate" type="date" defaultValue={data.invoiceDate.toISOString().slice(0,10)} required /></div>
          <div><label>Proveedor</label><input name="supplier" defaultValue={data.supplier} required /></div>
          <div><label>Moneda</label><input name="currency" defaultValue={data.currency} /></div>
          <div><label>Flete internacional</label><input name="freightUsd" type="number" min="0" step="0.01" defaultValue={Number(data.freightUsd)} /></div>
          <div><label>Prorrateo flete</label><select name="freightProrationMethod" defaultValue={data.freightProrationMethod}><option value="POR_VALOR">POR_VALOR</option><option value="POR_PESO_NETO">POR_PESO_NETO</option><option value="POR_PESO_BRUTO">POR_PESO_BRUTO</option><option value="POR_CANTIDAD">POR_CANTIDAD</option></select></div>
          <div className="md:col-span-3"><label>Descripción general</label><textarea name="description" rows={2} defaultValue={data.description ?? ''} /></div>
          <div className="md:col-span-3"><label>Observaciones</label><textarea name="notes" rows={2} defaultValue={data.notes ?? ''} /></div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Documentación aduanera y póliza</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div><label>Número de DAI</label><input name="daiNumber" defaultValue={data.daiNumber ?? ''} /></div>
            <div><label>Fecha DAI</label><input name="daiDate" type="date" defaultValue={data.daiDate ? data.daiDate.toISOString().slice(0,10) : ''} /></div>
            <div><label>Número de póliza</label><input name="insurancePolicyNumber" defaultValue={data.insurancePolicyNumber ?? ''} /></div>
            <div><label>Aseguradora</label><input name="insuranceCompany" defaultValue={data.insuranceCompany ?? ''} /></div>
            <div><label>Fecha de emisión póliza</label><input name="insuranceIssuedAt" type="date" defaultValue={data.insuranceIssuedAt ? data.insuranceIssuedAt.toISOString().slice(0,10) : ''} /></div>
            <div><label>Fecha de vencimiento póliza</label><input name="insuranceExpiresAt" type="date" defaultValue={data.insuranceExpiresAt ? data.insuranceExpiresAt.toISOString().slice(0,10) : ''} /></div>
          </div>
        </div>

        <div className="grid gap-3">
          {[...data.items, { id: 'new-1', itemCode: '', description: '', quantity: 0, unit: 'METROS', unitPriceUsd: 0, netWeightKg: 0, grossWeightKg: 0, notes: '' }].map((item) => (
            <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-8">
              <input name="itemCode" placeholder="Código" defaultValue={item.itemCode} />
              <input name="itemDescription" placeholder="Descripción" className="md:col-span-2" defaultValue={item.description} />
              <input name="itemQuantity" type="number" min="0" step="0.01" defaultValue={Number(item.quantity)} />
              <input name="itemUnit" defaultValue={item.unit} />
              <input name="itemUnitPriceUsd" type="number" min="0" step="0.000001" defaultValue={Number(item.unitPriceUsd)} />
              <input name="itemNetWeightKg" type="number" min="0" step="0.01" defaultValue={Number(item.netWeightKg)} />
              <input name="itemGrossWeightKg" type="number" min="0" step="0.01" defaultValue={Number(item.grossWeightKg)} />
              <input name="itemNotes" className="md:col-span-8" defaultValue={item.notes ?? ''} />
            </div>
          ))}
        </div>
        <div className="flex justify-end"><button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Guardar cambios</button></div>
      </form>
    </div>
  )
}
