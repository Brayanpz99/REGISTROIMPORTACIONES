import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const imports = await prisma.import.findMany({
    include: {
      items: { include: { production: true } },
      expenses: { include: { allocations: { include: { importItem: true } } } },
      snapshots: { orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { invoiceDate: 'desc' },
  })

  const importaciones = imports.map((row) => ({
    codigo: row.code,
    fecha_factura: row.invoiceDate.toISOString().slice(0, 10),
    factura: row.invoiceNumber,
    proveedor: row.supplier,
    subtotal_mercancia_usd: Number(row.subtotalGoodsUsd),
    flete_usd: Number(row.freightUsd),
    total_importacion_usd: Number(row.importTotalUsd),
    gastos_adicionales_usd: Number(row.totalAdditionalExpenses),
    total_invertido_usd: Number(row.totalInvestedUsd),
    costo_vendible_usd: Number(row.snapshots[0]?.weightedSellableUnitCost ?? 0),
  }))

  const items = imports.flatMap((row) => row.items.map((item) => ({
    codigo_importacion: row.code,
    codigo_item: item.itemCode,
    descripcion: item.description,
    cantidad: Number(item.quantity),
    unidad: item.unit,
    precio_unitario_usd: Number(item.unitPriceUsd),
    valor_item_usd: Number(item.totalValueUsd),
    peso_neto_kg: Number(item.netWeightKg),
    peso_bruto_kg: Number(item.grossWeightKg),
    confeccionadas: item.production?.producedUnits ?? 0,
    vendibles: item.production?.sellableUnits ?? 0,
    desperdicio_kg: Number(item.production?.finalWasteKg ?? 0),
  })))

  const gastos = imports.flatMap((row) => row.expenses.map((expense) => ({
    codigo_importacion: row.code,
    fecha: expense.expenseDate.toISOString().slice(0, 10),
    categoria: expense.category,
    descripcion: expense.description,
    prorrateo: expense.prorationMethod,
    monto_usd: Number(expense.amountUsd),
    estado_pago: expense.paymentStatus,
    asignaciones: expense.allocations.map((a) => `${a.importItem.itemCode}:${Number(a.amountUsd).toFixed(2)}`).join(' | '),
  })))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(importaciones), 'Importaciones')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items), 'Items')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gastos), 'Gastos')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="mini-erp-costos.xlsx"',
    },
  })
}
