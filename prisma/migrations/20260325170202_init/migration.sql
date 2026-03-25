-- CreateEnum
CREATE TYPE "ImportLotStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRANSPORTE_INTERNO', 'DESCARGUE', 'MANO_DE_OBRA', 'SERVICIOS_BASICOS', 'AGENCIA_ADUANA', 'NAVIERA', 'CONTECON', 'INSUMOS', 'DESPERDICIO', 'TRANSPORTE_EXPORTACION', 'CARGUE', 'OTROS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD', 'CHECK', 'OTHER');

-- CreateTable
CREATE TABLE "ImportLot" (
    "id" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "invoiceValueUsd" DECIMAL(14,2) NOT NULL,
    "freightUsd" DECIMAL(14,2) NOT NULL,
    "importTotalUsd" DECIMAL(14,2) NOT NULL,
    "status" "ImportLotStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotExpense" (
    "id" TEXT NOT NULL,
    "importLotId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amountUsd" DECIMAL(14,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentDate" TIMESTAMP(3),
    "invoiceFileUrl" TEXT,
    "paymentProofFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionRecord" (
    "id" TEXT NOT NULL,
    "importLotId" TEXT NOT NULL,
    "producedUnits" INTEGER NOT NULL,
    "defectiveUnits" INTEGER NOT NULL DEFAULT 0,
    "sellableUnits" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostSnapshot" (
    "id" TEXT NOT NULL,
    "importLotId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "baseUnitCost" DECIMAL(14,4) NOT NULL,
    "totalUnitCost" DECIMAL(14,4) NOT NULL,
    "adjustedRealUnitCost" DECIMAL(14,4) NOT NULL,
    "totalExpensesUsd" DECIMAL(14,2) NOT NULL,
    "totalInvestedUsd" DECIMAL(14,2) NOT NULL,
    "producedUnits" INTEGER NOT NULL,
    "sellableUnits" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportLot_lotCode_key" ON "ImportLot"("lotCode");

-- CreateIndex
CREATE INDEX "ImportLot_date_idx" ON "ImportLot"("date");

-- CreateIndex
CREATE INDEX "ImportLot_supplier_idx" ON "ImportLot"("supplier");

-- CreateIndex
CREATE INDEX "ImportLot_lotCode_idx" ON "ImportLot"("lotCode");

-- CreateIndex
CREATE INDEX "LotExpense_importLotId_idx" ON "LotExpense"("importLotId");

-- CreateIndex
CREATE INDEX "LotExpense_category_idx" ON "LotExpense"("category");

-- CreateIndex
CREATE INDEX "LotExpense_expenseDate_idx" ON "LotExpense"("expenseDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionRecord_importLotId_key" ON "ProductionRecord"("importLotId");

-- CreateIndex
CREATE INDEX "CostSnapshot_importLotId_idx" ON "CostSnapshot"("importLotId");

-- CreateIndex
CREATE UNIQUE INDEX "CostSnapshot_importLotId_version_key" ON "CostSnapshot"("importLotId", "version");

-- AddForeignKey
ALTER TABLE "LotExpense" ADD CONSTRAINT "LotExpense_importLotId_fkey" FOREIGN KEY ("importLotId") REFERENCES "ImportLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRecord" ADD CONSTRAINT "ProductionRecord_importLotId_fkey" FOREIGN KEY ("importLotId") REFERENCES "ImportLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostSnapshot" ADD CONSTRAINT "CostSnapshot_importLotId_fkey" FOREIGN KEY ("importLotId") REFERENCES "ImportLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
