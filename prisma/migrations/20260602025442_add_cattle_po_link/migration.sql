-- AlterEnum
ALTER TYPE "CattlePOStatus" ADD VALUE 'PARTIALLY_RECEIVED';

-- AlterTable
ALTER TABLE "Cattle" ADD COLUMN     "purchasingId" TEXT;

-- AlterTable
ALTER TABLE "CattlePurchasing" ADD COLUMN     "headReceived" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Cattle_purchasingId_idx" ON "Cattle"("purchasingId");

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_purchasingId_fkey" FOREIGN KEY ("purchasingId") REFERENCES "CattlePurchasing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
