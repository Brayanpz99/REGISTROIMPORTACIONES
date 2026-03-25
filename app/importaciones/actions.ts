'use server'

import { ProrationMethod } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateNextLotCode } from '@/lib/utils/lot-code'
import { computeProductionFields } from '@/lib/costing/calculate-lot-costs'
import { recalculateAndSnapshot } from '@/lib/costing/recalculate-and-snapshot'

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value ?? fallback)
  return Number.isFinite(n) ? n : fallback
}

function allocationBase(item: { totalValueUsd: unknown; netWeightKg: unknown; grossWeightKg: unknown; quantity: unknown }, method: ProrationMethod) {
  if (method === 'POR_PESO_NETO') return Number(item.netWeightKg)
  if (method === 'POR_PESO_BRUTO') return Number(item.grossWeightKg)
  if (method === 'POR_CANTIDAD') return Number(item.quantity)
  return Number(item.totalValueUsd)
}

function buildAutoAllocations(items: Array<{ id: string; totalValueUsd: unknown; netWeightKg: unknown; grossWeightKg: unknown; quantity: unknown }>, amount: number, method: ProrationMethod) {
  const basis = items.map((item) => ({ id: item.id, basis: allocationBase(item, method) }))
  const totalBasis = basis.reduce((sum, row) => sum + row.basis, 0)
  let accumulated = 0
  return basis.map((row, index) => {
    if (index === basis.length - 1) {
      const finalAmount = Number((amount - accumulated).toFixed(2))
      return { importItemId: row.id, amountUsd: finalAmount, allocationPct: totalBasis > 0 ? Number((row.basis / totalBasis).toFixed(6)) : 0 }
    }
    const allocation = totalBasis > 0 ? Number(((amount * row.basis) / totalBasis).toFixed(2)) : Number((amount / Math.max(items.length, 1)).toFixed(2))
    accumulated += allocation
    return { importItemId: row.id, amountUsd: allocation, allocationPct: totalBasis > 0 ? Number((row.basis / totalBasis).toFixed(6)) : 0 }
  })
}

function parseItems(formData: FormData) {
  const codes = formData.getAll('itemCode').map((v) => String(v).trim())
  const descriptions = formData.getAll('itemDescription').map((v) => String(v).trim())
  const quantities = formData.getAll('itemQuantity').map((v) => Number(v || 0))
  const units = formData.getAll('itemUnit').map((v) => String(v).trim())
  const prices = formData.getAll('itemUnitPriceUsd').map((v) => Number(v || 0))
  const netWeights = formData.getAll('itemNetWeightKg').map((v) => Number(v || 0))
  const grossWeights = formData.getAll('itemGrossWeightKg').map((v) => Number(v || 0))
  const notes = formData.getAll('itemNotes').map((v) => String(v).trim())

  const items = codes
    .map((code, i) => ({
      itemCode: code,
      description: descriptions[i] || '',
      quantity: quantities[i] || 0,
      unit: units[i] || 'UNIDADES',
      unitPriceUsd: prices[i] || 0,
      totalValueUsd: Number(((quantities[i] || 0) * (prices[i] || 0)).toFixed(2)),
      netWeightKg: netWeights[i] || 0,
      grossWeightKg: grossWeights[i] || 0,
      notes: notes[i] || null,
    }))
    .filter((item) => item.itemCode && item.description)

  if (!items.length) throw new Error('Debes registrar al menos un ítem válido.')
  if (items.some((item) => item.quantity < 0 || item.unitPriceUsd < 0 || item.netWeightKg < 0 || item.grossWeightKg < 0)) {
    throw new Error('No se permiten valores negativos en ítems.')
  }

  return items
}

export async function createImportAction(formData: FormData) {
  const invoiceNumber = String(formData.get('invoiceNumber') || '').trim()
  const supplier = String(formData.get('supplier') || '').trim()
  const invoiceDate = String(formData.get('invoiceDate') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null
  const currency = String(formData.get('currency') || 'USD').trim()
  const freightUsd = parseNumber(formData.get('freightUsd'))
  const freightProrationMethod = String(formData.get('freightProrationMethod') || 'POR_VALOR') as ProrationMethod

  if (!invoiceNumber || !supplier || !invoiceDate) throw new Error('Factura, proveedor y fecha son obligatorios.')
  if (freightUsd < 0) throw new Error('El flete no puede ser negativo.')

  const items = parseItems(formData)

  const record = await prisma.import.create({
    data: {
      code: await generateNextLotCode(),
      invoiceNumber,
      supplier,
      invoiceDate: new Date(invoiceDate),
      description,
      notes,
      currency,
      freightUsd,
      freightProrationMethod,
      items: { create: items },
    },
  })

  await recalculateAndSnapshot(record.id, 'Creación de importación')
  revalidatePath('/importaciones')
  redirect(`/importaciones/${record.id}`)
}

export async function updateImportAction(importId: string, formData: FormData) {
  const invoiceNumber = String(formData.get('invoiceNumber') || '').trim()
  const supplier = String(formData.get('supplier') || '').trim()
  const invoiceDate = String(formData.get('invoiceDate') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null
  const currency = String(formData.get('currency') || 'USD').trim()
  const freightUsd = parseNumber(formData.get('freightUsd'))
  const freightProrationMethod = String(formData.get('freightProrationMethod') || 'POR_VALOR') as ProrationMethod

  const items = parseItems(formData)

  await prisma.$transaction(async (tx) => {
    await tx.import.update({
      where: { id: importId },
      data: { invoiceNumber, supplier, invoiceDate: new Date(invoiceDate), description, notes, currency, freightUsd, freightProrationMethod },
    })
    await tx.importItem.deleteMany({ where: { importId } })
    await tx.importItem.createMany({ data: items.map((item) => ({ ...item, importId })) })
  })

  await recalculateAndSnapshot(importId, 'Edición de cabecera/ítems')
  revalidatePath(`/importaciones/${importId}`)
  redirect(`/importaciones/${importId}`)
}

export async function deleteImportAction(importId: string) {
  await prisma.import.delete({ where: { id: importId } })
  revalidatePath('/importaciones')
  redirect('/importaciones')
}

export async function createExpenseAction(importId: string, formData: FormData) {
  const category = String(formData.get('category') || 'OTROS') as never
  const description = String(formData.get('description') || '').trim()
  const amountUsd = parseNumber(formData.get('amountUsd'))
  const expenseDate = String(formData.get('expenseDate') || '').trim()
  const provider = String(formData.get('provider') || '').trim()
  const paymentStatus = String(formData.get('paymentStatus') || 'PENDING') as never
  const paymentMethodValue = String(formData.get('paymentMethod') || '').trim()
  const paymentDateValue = String(formData.get('paymentDate') || '').trim()
  const prorationMethod = String(formData.get('prorationMethod') || 'POR_VALOR') as ProrationMethod
  const manualJson = String(formData.get('manualAllocationsJson') || '').trim()

  if (!description || !expenseDate || !provider) throw new Error('Completa los datos del gasto.')
  if (amountUsd < 0) throw new Error('Monto inválido.')

  const items = await prisma.importItem.findMany({ where: { importId }, orderBy: { itemCode: 'asc' } })

  await prisma.$transaction(async (tx) => {
    const expense = await tx.importExpense.create({
      data: {
        importId,
        category,
        description,
        amountUsd,
        expenseDate: new Date(expenseDate),
        provider,
        paymentStatus,
        paymentMethod: paymentMethodValue ? (paymentMethodValue as never) : undefined,
        paymentDate: paymentDateValue ? new Date(paymentDateValue) : undefined,
        prorationMethod,
      },
    })

    if (prorationMethod === 'MANUAL') {
      const manualAllocations = manualJson ? (JSON.parse(manualJson) as Array<{ itemCode: string; amountUsd: number }>) : []
      const allocations = manualAllocations
        .map((row) => {
          const item = items.find((it) => it.itemCode === row.itemCode)
          return item ? { importItemId: item.id, amountUsd: Number(row.amountUsd || 0), allocationPct: amountUsd > 0 ? Number((Number(row.amountUsd || 0) / amountUsd).toFixed(6)) : 0 } : null
        })
        .filter(Boolean) as Array<{ importItemId: string; amountUsd: number; allocationPct: number }>

      if (allocations.length) {
        await tx.importExpenseAllocation.createMany({
          data: allocations.map((a) => ({ ...a, expenseId: expense.id, isManual: true })),
        })
      }
    } else {
      const allocations = buildAutoAllocations(items, amountUsd, prorationMethod)
      if (allocations.length) {
        await tx.importExpenseAllocation.createMany({
          data: allocations.map((a) => ({ ...a, expenseId: expense.id, isManual: false })),
        })
      }
    }
  })

  await recalculateAndSnapshot(importId, 'Nuevo gasto registrado')
  revalidatePath(`/importaciones/${importId}`)
  redirect(`/importaciones/${importId}`)
}

export async function deleteExpenseAction(importId: string, expenseId: string) {
  await prisma.importExpense.delete({ where: { id: expenseId } })
  await recalculateAndSnapshot(importId, 'Eliminación de gasto')
  revalidatePath(`/importaciones/${importId}`)
}

export async function saveItemProductionAction(importId: string, itemId: string, formData: FormData) {
  const producedUnits = Math.trunc(parseNumber(formData.get('producedUnits')))
  const defectiveUnits = Math.trunc(parseNumber(formData.get('defectiveUnits')))
  const grammageValue = parseNumber(formData.get('grammageValue'))
  const grammageUnit = String(formData.get('grammageUnit') || 'KG') as 'GRAMOS' | 'KG'
  const unitsPerBundle = formData.get('unitsPerBundle') ? Math.trunc(parseNumber(formData.get('unitsPerBundle'))) : null
  const bundleCount = formData.get('bundleCount') ? Math.trunc(parseNumber(formData.get('bundleCount'))) : null
  const manualWasteAdjustmentKg = parseNumber(formData.get('manualWasteAdjustmentKg'))
  const wasteAdjustmentReason = String(formData.get('wasteAdjustmentReason') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null

  const item = await prisma.importItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Ítem no encontrado.')

  const calc = computeProductionFields({
    producedUnits,
    defectiveUnits,
    grammageValue,
    grammageUnit,
    netWeightKg: Number(item.netWeightKg),
    manualWasteAdjustmentKg,
    unitsPerBundle,
    bundleCount,
  })

  await prisma.itemProduction.upsert({
    where: { importItemId: itemId },
    update: {
      producedUnits,
      defectiveUnits,
      sellableUnits: calc.sellableUnits,
      grammageValue,
      grammageUnit,
      grammageKg: calc.grammageKg,
      unitsPerBundle,
      bundleCount,
      estimatedUnitsByBundle: calc.estimatedUnitsByBundle,
      theoreticalExportWeightKg: calc.theoreticalExportWeightKg,
      calculatedWasteKg: calc.calculatedWasteKg,
      manualWasteAdjustmentKg,
      wasteAdjustmentReason,
      finalWasteKg: calc.finalWasteKg,
      notes,
    },
    create: {
      importItemId: itemId,
      producedUnits,
      defectiveUnits,
      sellableUnits: calc.sellableUnits,
      grammageValue,
      grammageUnit,
      grammageKg: calc.grammageKg,
      unitsPerBundle,
      bundleCount,
      estimatedUnitsByBundle: calc.estimatedUnitsByBundle,
      theoreticalExportWeightKg: calc.theoreticalExportWeightKg,
      calculatedWasteKg: calc.calculatedWasteKg,
      manualWasteAdjustmentKg,
      wasteAdjustmentReason,
      finalWasteKg: calc.finalWasteKg,
      notes,
    },
  })

  await recalculateAndSnapshot(importId, `Producción actualizada para ítem ${item.itemCode}`)
  revalidatePath(`/importaciones/${importId}`)
}
