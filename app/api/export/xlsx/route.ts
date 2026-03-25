import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const lots = await prisma.importLot.findMany({
    include: {
      expenses: true,
      production: true,
      costSnapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { date: 'desc' },
  })

  const importaciones = lots.map((lot) => ({
    lote: lot.lotCode,
    fecha: lot.date.toISOString().slice(0, 10),
    factura: lot.invoiceNumber,
    proveedor: lot.supplier,
    descripcion: lot.description,
    valor_factura_usd: Number(lot.invoiceValueUsd),
    flete_usd: Number(lot.freightUsd),
    total_importacion_usd: Number(lot.importTotalUsd),
    producidas: lot.production?.producedUnits ?? 0,
    defectuosas: lot.production?.defectiveUnits ?? 0,
    vendibles: lot.production?.sellableUnits ?? 0,
    costo_base: Number(lot.costSnapshots[0]?.baseUnitCost ?? 0),
    costo_total: Number(lot.costSnapshots[0]?.totalUnitCost ?? 0),
    costo_real: Number(lot.costSnapshots[0]?.adjustedRealUnitCost ?? 0),
  }))

  const gastos = lots.flatMap((lot) => lot.expenses.map((expense) => ({
    lote: lot.lotCode,
    fecha: expense.expenseDate.toISOString().slice(0, 10),
    categoria: expense.category,
    descripcion: expense.description,
    proveedor: expense.provider,
    monto_usd: Number(expense.amountUsd),
    estado_pago: expense.paymentStatus,
    metodo_pago: expense.paymentMethod ?? '',
  })))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(importaciones), 'Importaciones')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gastos), 'Gastos')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mini-erp-costos.xlsx"',
    },
  })
}
