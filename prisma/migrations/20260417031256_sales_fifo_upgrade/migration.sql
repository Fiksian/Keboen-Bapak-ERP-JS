/*
  Warnings:

  - The values [PENDING] on the enum `PenjualanStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PenjualanStatus_new" AS ENUM ('PENDING_SALES', 'PENDING_ADMIN', 'PENDING_SUPERVISOR', 'PENDING_MANAGER', 'COMPLETED', 'CANCELLED', 'REJECTED');
ALTER TYPE "PenjualanStatus" RENAME TO "PenjualanStatus_old";
ALTER TYPE "PenjualanStatus_new" RENAME TO "PenjualanStatus";
DROP TYPE "PenjualanStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Penjualan" ADD COLUMN     "adminApprovedAt" TIMESTAMP(3),
ADD COLUMN     "adminApprovedBy" TEXT,
ADD COLUMN     "adminNotes2" TEXT,
ADD COLUMN     "isStockDeducted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "managerApprovedBy" TEXT,
ADD COLUMN     "managerNotes" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectedNotes" TEXT,
ADD COLUMN     "saleType" TEXT NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "salesApprovedAt" TIMESTAMP(3),
ADD COLUMN     "salesApprovedBy" TEXT,
ADD COLUMN     "salesNotes2" TEXT,
ADD COLUMN     "supervisorApprovedAt" TIMESTAMP(3),
ADD COLUMN     "supervisorApprovedBy" TEXT,
ADD COLUMN     "supervisorNotes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_SALES';

-- AlterTable
ALTER TABLE "PenjualanItem" ADD COLUMN     "batchAllocation" TEXT DEFAULT '[]',
ADD COLUMN     "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "warehouseId" TEXT;

-- CreateIndex
CREATE INDEX "Penjualan_saleType_idx" ON "Penjualan"("saleType");

-- CreateIndex
CREATE INDEX "Penjualan_status_idx" ON "Penjualan"("status");

-- CreateIndex
CREATE INDEX "Penjualan_isStockDeducted_idx" ON "Penjualan"("isStockDeducted");
