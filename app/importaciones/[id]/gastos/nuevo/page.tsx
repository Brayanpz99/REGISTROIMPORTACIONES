import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createExpenseAction } from '@/app/importaciones/actions'

const categories = ['TRANSPORTE_INTERNO','DESCARGUE','MANO_DE_OBRA','SERVICIOS_BASICOS','AGENCIA_ADUANA','NAVIERA','CONTECON','INSUMOS','DESPERDICIO','TRANSPORTE_EXPORTACION','CARGUE','OTROS']

export default async function NuevoGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await prisma.import.findUnique({ where: { id }, include: { items: { orderBy: { itemCode: 'asc' } } } })
  if (!data) notFound()

  const action = createExpenseAction.bind(null, id)
  const template = JSON.stringify(data.items.map((item) => ({ itemCode: item.itemCode, amountUsd: 0 })), null, 2)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div><p className="text-sm font-medium text-slate-500">Nuevo gasto</p><h1 className="text-4xl font-semibold tracking-tight text-slate-950">{data.code}</h1></div>
      <form action={action} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <div><label htmlFor="category">Categoría</label><select id="category" name="category" required>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label htmlFor="provider">Proveedor</label><input id="provider" name="provider" required /></div>
          <div className="md:col-span-2"><label htmlFor="description">Descripción</label><textarea id="description" name="description" rows={3} required /></div>
          <div><label htmlFor="amountUsd">Monto (USD)</label><input id="amountUsd" name="amountUsd" type="number" min="0" step="0.01" required /></div>
          <div><label htmlFor="expenseDate">Fecha</label><input id="expenseDate" name="expenseDate" type="date" required /></div>
          <div><label htmlFor="prorationMethod">Método de prorrateo</label><select id="prorationMethod" name="prorationMethod" defaultValue="POR_VALOR"><option value="POR_VALOR">POR_VALOR</option><option value="POR_PESO_NETO">POR_PESO_NETO</option><option value="POR_PESO_BRUTO">POR_PESO_BRUTO</option><option value="POR_CANTIDAD">POR_CANTIDAD</option><option value="MANUAL">MANUAL</option></select></div>
          <div><label htmlFor="paymentStatus">Estado de pago</label><select id="paymentStatus" name="paymentStatus" defaultValue="PENDING"><option value="PENDING">Pendiente</option><option value="PAID">Pagado</option></select></div>
          <div><label htmlFor="paymentMethod">Método de pago</label><select id="paymentMethod" name="paymentMethod" defaultValue=""><option value="">No definido</option><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="CHECK">Cheque</option><option value="OTHER">Otro</option></select></div>
          <div><label htmlFor="paymentDate">Fecha de pago</label><input id="paymentDate" name="paymentDate" type="date" /></div>
          <div className="md:col-span-2"><label htmlFor="manualAllocationsJson">Asignación manual JSON (solo método MANUAL)</label><textarea id="manualAllocationsJson" name="manualAllocationsJson" rows={6} defaultValue={template} /></div>
        </div>
        <div className="mt-6 flex justify-end"><button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Guardar gasto</button></div>
      </form>
    </div>
  )
}
