/*
  Warnings:

  - The values [SCHEDULLING,IN_PROGRESS] on the enum `ProductionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductionStatus_new" AS ENUM ('PENDING_QC_PROD', 'PENDING_ADMIN', 'PENDING_SUPERVISOR', 'PENDING_MANAGER', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Production" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Production" ALTER COLUMN "status" TYPE "ProductionStatus_new" USING ("status"::text::"ProductionStatus_new");
ALTER TYPE "ProductionStatus" RENAME TO "ProductionStatus_old";
ALTER TYPE "ProductionStatus_new" RENAME TO "ProductionStatus";
DROP TYPE "ProductionStatus_old";
ALTER TABLE "Production" ALTER COLUMN "status" SET DEFAULT 'PENDING_QC_PROD';
COMMIT;

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "adminApprovedAt" TIMESTAMP(3),
ADD COLUMN     "adminApprovedBy" TEXT,
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "hpp" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lossWarning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "managerApprovedBy" TEXT,
ADD COLUMN     "managerNotes" TEXT,
ADD COLUMN     "qcApprovedAt" TIMESTAMP(3),
ADD COLUMN     "qcApprovedBy" TEXT,
ADD COLUMN     "qcNotes" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectedNotes" TEXT,
ADD COLUMN     "rendemen" DOUBLE PRECISION,
ADD COLUMN     "supervisorApprovedAt" TIMESTAMP(3),
ADD COLUMN     "supervisorApprovedBy" TEXT,
ADD COLUMN     "supervisorNotes" TEXT,
ADD COLUMN     "targetUnit" TEXT NOT NULL DEFAULT 'UNIT',
ADD COLUMN     "warehouseId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_QC_PROD';

-- AlterTable
ALTER TABLE "ProductionComponent" ADD COLUMN     "batchAllocation" TEXT DEFAULT '[]',
ADD COLUMN     "stockAvailable" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "warehouseId" TEXT,
ALTER COLUMN "unit" SET DEFAULT 'KG';

-- AlterTable
ALTER TABLE "StockBatch" ADD COLUMN     "productionId" TEXT;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
