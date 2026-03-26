-- AlterTable
ALTER TABLE "Import"
ADD COLUMN "daiNumber" TEXT,
ADD COLUMN "daiDate" TIMESTAMP(3),
ADD COLUMN "insurancePolicyNumber" TEXT,
ADD COLUMN "insuranceCompany" TEXT,
ADD COLUMN "insuranceIssuedAt" TIMESTAMP(3),
ADD COLUMN "insuranceExpiresAt" TIMESTAMP(3);
