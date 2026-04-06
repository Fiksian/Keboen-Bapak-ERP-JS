-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_warehouseId_fkey";

-- DropIndex
DROP INDEX "STTB_purchasingId_idx";

-- DropIndex
DROP INDEX "STTB_receiptId_idx";

-- DropIndex
DROP INDEX "STTB_status_idx";

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
