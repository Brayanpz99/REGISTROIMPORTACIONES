'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateNextLotCode } from '@/lib/utils/lot-code'
import { recalculateAndSnapshot } from '@/lib/costing/recalculate-and-snapshot'

export async function createImportLotAction(formData: FormData) {
  const invoiceNumber = String(formData.get('invoiceNumber') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const supplier = String(formData.get('supplier') || '').trim()
  const date = String(formData.get('date') || '').trim()
  const invoiceValueUsd = Number(formData.get('invoiceValueUsd') || 0)
  const freightUsd = Number(formData.get('freightUsd') || 0)

  if (!invoiceNumber || !description || !supplier || !date) throw new Error('Faltan campos obligatorios.')
  if (invoiceValueUsd < 0 || freightUsd < 0) throw new Error('No se permiten valores negativos.')

  const lot = await prisma.importLot.create({
    data: {
      lotCode: await generateNextLotCode(),
      invoiceNumber,
      description,
      supplier,
      date: new Date(date),
      invoiceValueUsd,
      freightUsd,
      importTotalUsd: invoiceValueUsd + freightUsd,
      status: 'ACTIVE',
    },
  })

  revalidatePath('/importaciones')
  redirect(`/importaciones/${lot.id}`)
}

export async function createExpenseAction(importLotId: string, formData: FormData) {
  const category = String(formData.get('category') || '').trim() as never
  const description = String(formData.get('description') || '').trim()
  const amountUsd = Number(formData.get('amountUsd') || 0)
  const expenseDate = String(formData.get('expenseDate') || '').trim()
  const provider = String(formData.get('provider') || '').trim()
  const paymentStatus = String(formData.get('paymentStatus') || 'PENDING') as never
  const paymentMethodValue = String(formData.get('paymentMethod') || '').trim()
  const paymentDateValue = String(formData.get('paymentDate') || '').trim()

  if (!category || !description || !expenseDate || !provider) throw new Error('Completa los datos del gasto.')
  if (amountUsd < 0) throw new Error('Monto inválido.')

  await prisma.lotExpense.create({
    data: {
      importLotId,
      category,
      description,
      amountUsd,
      expenseDate: new Date(expenseDate),
      provider,
      paymentStatus,
      paymentMethod: paymentMethodValue ? paymentMethodValue as never : undefined,
      paymentDate: paymentDateValue ? new Date(paymentDateValue) : undefined,
    },
  })

  await recalculateAndSnapshot(importLotId, 'Nuevo gasto registrado')
  revalidatePath(`/importaciones/${importLotId}`)
  redirect(`/importaciones/${importLotId}`)
}

export async function saveProductionAction(importLotId: string, formData: FormData) {
  const producedUnits = Number(formData.get('producedUnits') || 0)
  const defectiveUnits = Number(formData.get('defectiveUnits') || 0)
  const notes = String(formData.get('notes') || '').trim()

  if (producedUnits <= 0) throw new Error('La producción debe ser mayor a cero.')
  if (defectiveUnits < 0 || defectiveUnits > producedUnits) throw new Error('Defectos inválidos.')

  await prisma.productionRecord.upsert({
    where: { importLotId },
    update: {
      producedUnits,
      defectiveUnits,
      sellableUnits: producedUnits - defectiveUnits,
      notes,
    },
    create: {
      importLotId,
      producedUnits,
      defectiveUnits,
      sellableUnits: producedUnits - defectiveUnits,
      notes,
    },
  })

  await recalculateAndSnapshot(importLotId, 'Producción actualizada')
  revalidatePath(`/importaciones/${importLotId}`)
  redirect(`/importaciones/${importLotId}`)
}
