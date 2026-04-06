-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_warehouseId_fkey";

-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "warehouseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "STTB" (
    "id" TEXT NOT NULL,
    "sttbNo" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "purchasingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_QC',
    "qcApprovedBy" TEXT,
    "qcApprovedAt" TIMESTAMP(3),
    "qcNotes" TEXT,
    "supervisorApprovedBy" TEXT,
    "supervisorApprovedAt" TIMESTAMP(3),
    "supervisorNotes" TEXT,
    "managerApprovedBy" TEXT,
    "managerApprovedAt" TIMESTAMP(3),
    "managerNotes" TEXT,
    "warehouseId" TEXT,
    "stockCommitted" BOOLEAN NOT NULL DEFAULT false,
    "stockCommittedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "STTB_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "STTB_sttbNo_key" ON "STTB"("sttbNo");

-- CreateIndex
CREATE UNIQUE INDEX "STTB_receiptId_key" ON "STTB"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "STTB_purchasingId_key" ON "STTB"("purchasingId");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STTB" ADD CONSTRAINT "STTB_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STTB" ADD CONSTRAINT "STTB_purchasingId_fkey" FOREIGN KEY ("purchasingId") REFERENCES "Purchasing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STTB" ADD CONSTRAINT "STTB_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
