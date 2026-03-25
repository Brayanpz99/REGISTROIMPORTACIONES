-- Rediseño integral: modelo de importación multi-ítem con prorrateo, producción por ítem y snapshots detallados.

DROP TABLE IF EXISTS "ItemCostSnapshot" CASCADE;
DROP TABLE IF EXISTS "CostSnapshot" CASCADE;
DROP TABLE IF EXISTS "ItemProduction" CASCADE;
DROP TABLE IF EXISTS "ImportExpenseAllocation" CASCADE;
DROP TABLE IF EXISTS "ImportExpense" CASCADE;
DROP TABLE IF EXISTS "ImportItem" CASCADE;
DROP TABLE IF EXISTS "Attachment" CASCADE;
DROP TABLE IF EXISTS "ProductionRecord" CASCADE;
DROP TABLE IF EXISTS "LotExpense" CASCADE;
DROP TABLE IF EXISTS "ImportLot" CASCADE;

DROP TYPE IF EXISTS "GramajeUnit";
DROP TYPE IF EXISTS "ProrationMethod";
DROP TYPE IF EXISTS "ImportStatus";
DROP TYPE IF EXISTS "ImportLotStatus";

CREATE TYPE "ImportStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE "ProrationMethod" AS ENUM ('POR_VALOR', 'POR_PESO_NETO', 'POR_PESO_BRUTO', 'POR_CANTIDAD', 'MANUAL');
CREATE TYPE "GramajeUnit" AS ENUM ('GRAMOS', 'KG');

CREATE TABLE "Import" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "supplier" TEXT NOT NULL,
  "description" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "freightUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "freightProrationMethod" "ProrationMethod" NOT NULL DEFAULT 'POR_VALOR',
  "notes" TEXT,
  "status" "ImportStatus" NOT NULL DEFAULT 'ACTIVE',
  "subtotalGoodsUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "importTotalUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalNetWeightKg" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalGrossWeightKg" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalQuantity" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalAdditionalExpenses" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalInvestedUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Import_code_key" ON "Import"("code");
CREATE INDEX "Import_invoiceDate_idx" ON "Import"("invoiceDate");
CREATE INDEX "Import_supplier_idx" ON "Import"("supplier");
CREATE INDEX "Import_code_idx" ON "Import"("code");

CREATE TABLE "ImportItem" (
  "id" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(14,2) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitPriceUsd" DECIMAL(14,6) NOT NULL,
  "totalValueUsd" DECIMAL(14,2) NOT NULL,
  "netWeightKg" DECIMAL(14,2) NOT NULL,
  "grossWeightKg" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImportItem_importId_itemCode_key" ON "ImportItem"("importId", "itemCode");
CREATE INDEX "ImportItem_importId_idx" ON "ImportItem"("importId");

CREATE TABLE "Attachment" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportExpense" (
  "id" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
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
  "prorationMethod" "ProrationMethod" NOT NULL DEFAULT 'POR_VALOR',
  "attachmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportExpense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ImportExpense_importId_idx" ON "ImportExpense"("importId");
CREATE INDEX "ImportExpense_expenseDate_idx" ON "ImportExpense"("expenseDate");

CREATE TABLE "ImportExpenseAllocation" (
  "id" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "importItemId" TEXT NOT NULL,
  "amountUsd" DECIMAL(14,2) NOT NULL,
  "allocationPct" DECIMAL(8,6) NOT NULL,
  "isManual" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportExpenseAllocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImportExpenseAllocation_expenseId_importItemId_key" ON "ImportExpenseAllocation"("expenseId", "importItemId");
CREATE INDEX "ImportExpenseAllocation_importItemId_idx" ON "ImportExpenseAllocation"("importItemId");

CREATE TABLE "ItemProduction" (
  "id" TEXT NOT NULL,
  "importItemId" TEXT NOT NULL,
  "producedUnits" INTEGER NOT NULL,
  "defectiveUnits" INTEGER NOT NULL DEFAULT 0,
  "sellableUnits" INTEGER NOT NULL,
  "grammageValue" DECIMAL(14,4) NOT NULL,
  "grammageUnit" "GramajeUnit" NOT NULL DEFAULT 'KG',
  "grammageKg" DECIMAL(14,6) NOT NULL,
  "unitsPerBundle" INTEGER,
  "bundleCount" INTEGER,
  "estimatedUnitsByBundle" INTEGER,
  "theoreticalExportWeightKg" DECIMAL(14,4) NOT NULL,
  "calculatedWasteKg" DECIMAL(14,4) NOT NULL,
  "manualWasteAdjustmentKg" DECIMAL(14,4) NOT NULL DEFAULT 0,
  "wasteAdjustmentReason" TEXT,
  "finalWasteKg" DECIMAL(14,4) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItemProduction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ItemProduction_importItemId_key" ON "ItemProduction"("importItemId");

CREATE TABLE "CostSnapshot" (
  "id" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "reason" TEXT,
  "previousValues" JSONB,
  "newValues" JSONB,
  "subtotalGoodsUsd" DECIMAL(14,2) NOT NULL,
  "freightUsd" DECIMAL(14,2) NOT NULL,
  "additionalExpensesUsd" DECIMAL(14,2) NOT NULL,
  "totalInvestedUsd" DECIMAL(14,2) NOT NULL,
  "totalItems" INTEGER NOT NULL,
  "totalProducedUnits" INTEGER NOT NULL,
  "totalSellableUnits" INTEGER NOT NULL,
  "totalTheoreticalKg" DECIMAL(14,4) NOT NULL,
  "weightedSellableUnitCost" DECIMAL(14,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CostSnapshot_importId_version_key" ON "CostSnapshot"("importId", "version");
CREATE INDEX "CostSnapshot_importId_idx" ON "CostSnapshot"("importId");

CREATE TABLE "ItemCostSnapshot" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "importItemId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "baseValueUsd" DECIMAL(14,2) NOT NULL,
  "freightAllocatedUsd" DECIMAL(14,2) NOT NULL,
  "otherExpensesAllocatedUsd" DECIMAL(14,2) NOT NULL,
  "totalAllocatedExpensesUsd" DECIMAL(14,2) NOT NULL,
  "totalItemCostUsd" DECIMAL(14,2) NOT NULL,
  "costPerProducedUnitUsd" DECIMAL(14,4),
  "costPerSellableUnitUsd" DECIMAL(14,4),
  "costPerExportableKgUsd" DECIMAL(14,4),
  "adjustedRealCostUsd" DECIMAL(14,4),
  "finalWasteKg" DECIMAL(14,4),
  "participationByValuePct" DECIMAL(8,6) NOT NULL,
  "participationByNetWeightPct" DECIMAL(8,6) NOT NULL,
  "participationByGrossWeightPct" DECIMAL(8,6) NOT NULL,
  "participationByQuantityPct" DECIMAL(8,6) NOT NULL,
  CONSTRAINT "ItemCostSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ImportItem" ADD CONSTRAINT "ImportItem_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportExpense" ADD CONSTRAINT "ImportExpense_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportExpense" ADD CONSTRAINT "ImportExpense_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportExpenseAllocation" ADD CONSTRAINT "ImportExpenseAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ImportExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportExpenseAllocation" ADD CONSTRAINT "ImportExpenseAllocation_importItemId_fkey" FOREIGN KEY ("importItemId") REFERENCES "ImportItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemProduction" ADD CONSTRAINT "ItemProduction_importItemId_fkey" FOREIGN KEY ("importItemId") REFERENCES "ImportItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostSnapshot" ADD CONSTRAINT "CostSnapshot_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemCostSnapshot" ADD CONSTRAINT "ItemCostSnapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CostSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemCostSnapshot" ADD CONSTRAINT "ItemCostSnapshot_importItemId_fkey" FOREIGN KEY ("importItemId") REFERENCES "ImportItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
