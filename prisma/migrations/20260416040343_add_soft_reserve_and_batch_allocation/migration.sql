-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "isReserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reservedAt" TIMESTAMP(3),
ADD COLUMN     "reservedBy" TEXT;

-- AlterTable
ALTER TABLE "ProductionComponent" ADD COLUMN     "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StockBatch" ADD COLUMN     "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductionBatchAllocation" (
    "id" TEXT NOT NULL,
    "productionComponentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "qtyAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isReserved" BOOLEAN NOT NULL DEFAULT false,
    "isDeducted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionBatchAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionBatchAllocation_batchId_idx" ON "ProductionBatchAllocation"("batchId");

-- CreateIndex
CREATE INDEX "ProductionBatchAllocation_productionComponentId_idx" ON "ProductionBatchAllocation"("productionComponentId");

-- CreateIndex
CREATE INDEX "ProductionBatchAllocation_isReserved_idx" ON "ProductionBatchAllocation"("isReserved");

-- CreateIndex
CREATE INDEX "Production_isReserved_idx" ON "Production"("isReserved");

-- CreateIndex
CREATE INDEX "StockBatch_reservedQty_idx" ON "StockBatch"("reservedQty");

-- AddForeignKey
ALTER TABLE "ProductionBatchAllocation" ADD CONSTRAINT "ProductionBatchAllocation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProductionBatchAllocation" ADD CONSTRAINT "ProductionBatchAllocation_productionComponentId_fkey" FOREIGN KEY ("productionComponentId") REFERENCES "ProductionComponent"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
