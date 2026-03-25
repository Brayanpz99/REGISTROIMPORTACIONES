import { createImportLotAction } from '../actions'

export default function NuevaImportacionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Nuevo lote</p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Registrar importación</h1>
      </div>

      <form action={createImportLotAction} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="invoiceNumber">Número de factura proveedor</label>
            <input id="invoiceNumber" name="invoiceNumber" required />
          </div>
          <div>
            <label htmlFor="supplier">Proveedor</label>
            <input id="supplier" name="supplier" required />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={3} required />
          </div>
          <div>
            <label htmlFor="date">Fecha</label>
            <input id="date" name="date" type="date" required />
          </div>
          <div>
            <label htmlFor="invoiceValueUsd">Valor factura (USD)</label>
            <input id="invoiceValueUsd" name="invoiceValueUsd" type="number" min="0" step="0.01" required />
          </div>
          <div>
            <label htmlFor="freightUsd">Flete internacional (USD)</label>
            <input id="freightUsd" name="freightUsd" type="number" min="0" step="0.01" required />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Guardar lote</button>
        </div>
      </form>
    </div>
  )
}
