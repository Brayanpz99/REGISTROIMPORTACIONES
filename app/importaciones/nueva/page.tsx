import { createImportAction } from '../actions'

const itemRows = Array.from({ length: 3 }, (_, i) => i)

export default function NuevaImportacionPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Nueva importación</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Registrar factura con múltiples ítems</h1>
      </div>

      <form action={createImportAction} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-3">
          <div><label htmlFor="invoiceNumber">Número de factura</label><input id="invoiceNumber" name="invoiceNumber" required /></div>
          <div><label htmlFor="invoiceDate">Fecha factura</label><input id="invoiceDate" name="invoiceDate" type="date" required /></div>
          <div><label htmlFor="supplier">Proveedor</label><input id="supplier" name="supplier" required /></div>
          <div><label htmlFor="currency">Moneda</label><input id="currency" name="currency" defaultValue="USD" /></div>
          <div><label htmlFor="freightUsd">Flete internacional</label><input id="freightUsd" name="freightUsd" type="number" min="0" step="0.01" required defaultValue="0" /></div>
          <div><label htmlFor="freightProrationMethod">Prorrateo flete</label><select id="freightProrationMethod" name="freightProrationMethod" defaultValue="POR_VALOR"><option value="POR_VALOR">POR_VALOR</option><option value="POR_PESO_NETO">POR_PESO_NETO</option><option value="POR_PESO_BRUTO">POR_PESO_BRUTO</option><option value="POR_CANTIDAD">POR_CANTIDAD</option></select></div>
          <div className="md:col-span-3"><label htmlFor="description">Descripción general</label><textarea id="description" name="description" rows={2} /></div>
          <div className="md:col-span-3"><label htmlFor="notes">Observaciones</label><textarea id="notes" name="notes" rows={2} /></div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-950">Ítems de la factura</h2>
          <div className="grid gap-3">
            {itemRows.map((index) => (
              <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-8">
                <input name="itemCode" placeholder="Código" />
                <input name="itemDescription" placeholder="Descripción" className="md:col-span-2" />
                <input name="itemQuantity" type="number" min="0" step="0.01" placeholder="Cantidad" />
                <input name="itemUnit" placeholder="Unidad" defaultValue="METROS" />
                <input name="itemUnitPriceUsd" type="number" min="0" step="0.000001" placeholder="Precio unitario" />
                <input name="itemNetWeightKg" type="number" min="0" step="0.01" placeholder="Peso neto kg" />
                <input name="itemGrossWeightKg" type="number" min="0" step="0.01" placeholder="Peso bruto kg" />
                <input name="itemNotes" placeholder="Observaciones" className="md:col-span-8" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end"><button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Guardar importación</button></div>
      </form>
    </div>
  )
}
