import { PrismaClient, ExpenseCategory, PaymentMethod, PaymentStatus } from '@prisma/client'
import { recalculateAndSnapshotForSeed } from '../lib/costing/recalculate-seed'

const prisma = new PrismaClient()

async function main() {
  await prisma.costSnapshot.deleteMany()
  await prisma.productionRecord.deleteMany()
  await prisma.lotExpense.deleteMany()
  await prisma.importLot.deleteMany()

  const lot = await prisma.importLot.create({
    data: {
      lotCode: 'BZ-ECU-0001',
      invoiceNumber: 'INV-2026-001',
      description: 'Tela poliéster Ganso - varios diseños',
      supplier: 'Proveedor China Demo',
      date: new Date('2026-03-01'),
      invoiceValueUsd: 81286.01,
      freightUsd: 3000,
      importTotalUsd: 84286.01,
      status: 'ACTIVE',
    },
  })

  await prisma.lotExpense.createMany({
    data: [
      { importLotId: lot.id, category: ExpenseCategory.TRANSPORTE_INTERNO, description: 'Transporte Guayaquil - planta', amountUsd: 1200, expenseDate: new Date('2026-03-05'), provider: 'Transporte Andino', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-06') },
      { importLotId: lot.id, category: ExpenseCategory.DESCARGUE, description: 'Descargue de contenedor', amountUsd: 450, expenseDate: new Date('2026-03-05'), provider: 'Cuadrilla local', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, paymentDate: new Date('2026-03-05') },
      { importLotId: lot.id, category: ExpenseCategory.MANO_DE_OBRA, description: 'Corte y confección', amountUsd: 2800, expenseDate: new Date('2026-03-12'), provider: 'Maquila Demo', paymentStatus: PaymentStatus.PENDING },
      { importLotId: lot.id, category: ExpenseCategory.SERVICIOS_BASICOS, description: 'Prorrateo de energía', amountUsd: 300, expenseDate: new Date('2026-03-12'), provider: 'Empresa eléctrica', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-12') },
      { importLotId: lot.id, category: ExpenseCategory.AGENCIA_ADUANA, description: 'Honorarios agencia', amountUsd: 1600, expenseDate: new Date('2026-03-04'), provider: 'Aduana Demo', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-04') },
      { importLotId: lot.id, category: ExpenseCategory.NAVIERA, description: 'Costos naviera', amountUsd: 2400, expenseDate: new Date('2026-03-03'), provider: 'Naviera Demo', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-03') },
      { importLotId: lot.id, category: ExpenseCategory.CONTECON, description: 'Servicios portuarios', amountUsd: 1100, expenseDate: new Date('2026-03-03'), provider: 'Contecon', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.TRANSFER, paymentDate: new Date('2026-03-03') },
      { importLotId: lot.id, category: ExpenseCategory.INSUMOS, description: 'Etiquetas e hilo', amountUsd: 900, expenseDate: new Date('2026-03-13'), provider: 'Insumos Norte', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, paymentDate: new Date('2026-03-13') },
      { importLotId: lot.id, category: ExpenseCategory.DESPERDICIO, description: 'Ajuste por desperdicio', amountUsd: 700, expenseDate: new Date('2026-03-15'), provider: 'Control interno', paymentStatus: PaymentStatus.PENDING },
      { importLotId: lot.id, category: ExpenseCategory.TRANSPORTE_EXPORTACION, description: 'Transporte a frontera', amountUsd: 850, expenseDate: new Date('2026-03-20'), provider: 'Transporte Sur', paymentStatus: PaymentStatus.PENDING },
      { importLotId: lot.id, category: ExpenseCategory.CARGUE, description: 'Cargue de exportación', amountUsd: 300, expenseDate: new Date('2026-03-20'), provider: 'Operadores de bodega', paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH, paymentDate: new Date('2026-03-20') },
    ]
  })

  await prisma.productionRecord.create({
    data: {
      importLotId: lot.id,
      producedUnits: 20000,
      defectiveUnits: 500,
      sellableUnits: 19500,
      notes: 'Lote inicial de prueba'
    }
  })

  await recalculateAndSnapshotForSeed(prisma, lot.id, 'Carga inicial seed')
}

main().finally(async () => {
  await prisma.$disconnect()
})
