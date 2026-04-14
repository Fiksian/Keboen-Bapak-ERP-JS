/*
  Warnings:

  - A unique constraint covering the columns `[receiptId]` on the table `StockBatch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sttbId]` on the table `StockBatch` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "BatchDeduction_createdAt_idx" ON "BatchDeduction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockBatch_receiptId_key" ON "StockBatch"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "StockBatch_sttbId_key" ON "StockBatch"("sttbId");
