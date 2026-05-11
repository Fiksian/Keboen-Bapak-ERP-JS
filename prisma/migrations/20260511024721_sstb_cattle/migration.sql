/*
  Warnings:

  - You are about to drop the column `driverName` on the `CattleArrival` table. All the data in the column will be lost.
  - You are about to drop the column `driverPhone` on the `CattleArrival` table. All the data in the column will be lost.
  - You are about to drop the column `poId` on the `CattleArrival` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `CattleArrival` table. All the data in the column will be lost.
  - You are about to drop the column `suratJalan` on the `CattleArrival` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeightArrived` on the `CattleArrival` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `CattleBatch` table. All the data in the column will be lost.
  - You are about to drop the column `jenisSapi` on the `CattleBatch` table. All the data in the column will be lost.
  - You are about to drop the column `poId` on the `CattleBatch` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeightKg` on the `CattleBatch` table. All the data in the column will be lost.
  - You are about to drop the column `weightRemaining` on the `CattleBatch` table. All the data in the column will be lost.
  - Added the required column `purchasingId` to the `CattleArrival` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noPO` to the `CattleBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchasingId` to the `CattleBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendorName` to the `CattleBatch` table without a default value. This is not possible if the table is not empty.
  - Made the column `warehouseId` on table `CattleBatch` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CattleArrival" DROP CONSTRAINT "CattleArrival_poId_fkey";

-- DropForeignKey
ALTER TABLE "CattleBatch" DROP CONSTRAINT "CattleBatch_poId_fkey";

-- DropForeignKey
ALTER TABLE "STTB" DROP CONSTRAINT "STTB_purchasingId_fkey";

-- DropForeignKey
ALTER TABLE "STTB" DROP CONSTRAINT "STTB_receiptId_fkey";

-- DropIndex
DROP INDEX "CattleArrival_arrivalNo_idx";

-- DropIndex
DROP INDEX "CattleArrival_poId_idx";

-- DropIndex
DROP INDEX "CattleBatch_poId_idx";

-- AlterTable
ALTER TABLE "CattleArrival" DROP COLUMN "driverName",
DROP COLUMN "driverPhone",
DROP COLUMN "poId",
DROP COLUMN "receivedAt",
DROP COLUMN "suratJalan",
DROP COLUMN "totalWeightArrived",
ADD COLUMN     "avgWeightPurchase" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avgWeightReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grossWeightTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "namaKapal" TEXT,
ADD COLUMN     "namaMKL" TEXT,
ADD COLUMN     "namaPBM" TEXT,
ADD COLUMN     "netWeightTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "noBl" TEXT,
ADD COLUMN     "noSuratJalan" TEXT,
ADD COLUMN     "purchasingId" TEXT NOT NULL,
ADD COLUMN     "rfidCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rfidFileUrl" TEXT,
ADD COLUMN     "rfidImported" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING_GRADING',
ADD COLUMN     "susutAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "susutKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "susutPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tareWeightTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "CattleBatch" DROP COLUMN "gender",
DROP COLUMN "jenisSapi",
DROP COLUMN "poId",
DROP COLUMN "totalWeightKg",
DROP COLUMN "weightRemaining",
ADD COLUMN     "arrivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "avgWeightCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avgWeightReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "depletedAt" TIMESTAMP(3),
ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "headDead" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "headReserved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "headSold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hppAwalPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "hppKumulatifPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "noPO" TEXT NOT NULL,
ADD COLUMN     "priceUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "purchasingId" TEXT NOT NULL,
ADD COLUMN     "totalHppKumulatif" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalWeightCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vendorName" TEXT NOT NULL,
ALTER COLUMN "warehouseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "STTB" ADD COLUMN     "beratBeli" DOUBLE PRECISION,
ADD COLUMN     "beratHidupRata" DOUBLE PRECISION,
ADD COLUMN     "beratHidupTotal" DOUBLE PRECISION,
ADD COLUMN     "cattleArrivalId" TEXT,
ADD COLUMN     "cattlePOId" TEXT,
ADD COLUMN     "isCattle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jumlahEkor" INTEGER,
ADD COLUMN     "susutAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "susutKg" DOUBLE PRECISION,
ADD COLUMN     "susutPct" DOUBLE PRECISION,
ALTER COLUMN "receiptId" DROP NOT NULL,
ALTER COLUMN "purchasingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "staffs" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "CattleTruck" (
    "id" TEXT NOT NULL,
    "arrivalId" TEXT NOT NULL,
    "noTruk" TEXT NOT NULL,
    "supirTruk" TEXT,
    "grossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tareWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "headCount" INTEGER NOT NULL DEFAULT 0,
    "avgWeightPerHead" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "weighedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CattleTruck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidTag" (
    "id" TEXT NOT NULL,
    "rfidNo" TEXT NOT NULL,
    "eartagNo" TEXT,
    "arrivalId" TEXT,
    "cattleId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,

    CONSTRAINT "RfidTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleInventory" (
    "id" TEXT NOT NULL,
    "rfidNo" TEXT,
    "eartagNo" TEXT,
    "internalCode" TEXT,
    "arrivalId" TEXT NOT NULL,
    "batchId" TEXT,
    "warehouseId" TEXT,
    "jenisKelamin" TEXT NOT NULL DEFAULT 'JANTAN',
    "breed" TEXT,
    "ageMonths" INTEGER,
    "weightPurchase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightGrading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightHarvest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "susutKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "susutPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppAwal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppKumulatif" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'QUARANTINE',
    "masukKandangAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keluarKandangAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattleInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleOverhead" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "cattleId" TEXT,
    "warehouseId" TEXT,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "biayaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "headCount" INTEGER NOT NULL DEFAULT 1,
    "biayaPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periode" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dicatatOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CattleOverhead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleBatchDeduction" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "referenceNo" TEXT,
    "headDeducted" INTEGER NOT NULL DEFAULT 0,
    "avgWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHpp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CattleBatchDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CattleTruck_arrivalId_idx" ON "CattleTruck"("arrivalId");

-- CreateIndex
CREATE UNIQUE INDEX "RfidTag_rfidNo_key" ON "RfidTag"("rfidNo");

-- CreateIndex
CREATE UNIQUE INDEX "RfidTag_cattleId_key" ON "RfidTag"("cattleId");

-- CreateIndex
CREATE INDEX "RfidTag_rfidNo_idx" ON "RfidTag"("rfidNo");

-- CreateIndex
CREATE INDEX "RfidTag_arrivalId_idx" ON "RfidTag"("arrivalId");

-- CreateIndex
CREATE INDEX "RfidTag_status_idx" ON "RfidTag"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CattleInventory_eartagNo_key" ON "CattleInventory"("eartagNo");

-- CreateIndex
CREATE INDEX "CattleInventory_arrivalId_idx" ON "CattleInventory"("arrivalId");

-- CreateIndex
CREATE INDEX "CattleInventory_batchId_idx" ON "CattleInventory"("batchId");

-- CreateIndex
CREATE INDEX "CattleInventory_status_idx" ON "CattleInventory"("status");

-- CreateIndex
CREATE INDEX "CattleInventory_rfidNo_idx" ON "CattleInventory"("rfidNo");

-- CreateIndex
CREATE INDEX "CattleOverhead_batchId_idx" ON "CattleOverhead"("batchId");

-- CreateIndex
CREATE INDEX "CattleOverhead_periode_idx" ON "CattleOverhead"("periode");

-- CreateIndex
CREATE INDEX "CattleOverhead_kategori_idx" ON "CattleOverhead"("kategori");

-- CreateIndex
CREATE INDEX "CattleBatchDeduction_batchId_idx" ON "CattleBatchDeduction"("batchId");

-- CreateIndex
CREATE INDEX "CattleBatchDeduction_referenceId_idx" ON "CattleBatchDeduction"("referenceId");

-- CreateIndex
CREATE INDEX "CattleArrival_purchasingId_idx" ON "CattleArrival"("purchasingId");

-- CreateIndex
CREATE INDEX "CattleArrival_status_idx" ON "CattleArrival"("status");

-- CreateIndex
CREATE INDEX "CattleArrival_createdAt_idx" ON "CattleArrival"("createdAt");

-- CreateIndex
CREATE INDEX "CattleBatch_arrivedAt_idx" ON "CattleBatch"("arrivedAt");

-- CreateIndex
CREATE INDEX "CattleBatch_warehouseId_idx" ON "CattleBatch"("warehouseId");

-- CreateIndex
CREATE INDEX "CattleBatch_purchasingId_idx" ON "CattleBatch"("purchasingId");

-- CreateIndex
CREATE INDEX "STTB_isCattle_idx" ON "STTB"("isCattle");

-- CreateIndex
CREATE INDEX "STTB_cattlePOId_idx" ON "STTB"("cattlePOId");

-- CreateIndex
CREATE INDEX "STTB_status_idx" ON "STTB"("status");

-- AddForeignKey
ALTER TABLE "STTB" ADD CONSTRAINT "STTB_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STTB" ADD CONSTRAINT "STTB_purchasingId_fkey" FOREIGN KEY ("purchasingId") REFERENCES "Purchasing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STTB" ADD CONSTRAINT "STTB_cattlePOId_fkey" FOREIGN KEY ("cattlePOId") REFERENCES "CattlePurchasing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleArrival" ADD CONSTRAINT "CattleArrival_purchasingId_fkey" FOREIGN KEY ("purchasingId") REFERENCES "CattlePurchasing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleArrival" ADD CONSTRAINT "CattleArrival_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleTruck" ADD CONSTRAINT "CattleTruck_arrivalId_fkey" FOREIGN KEY ("arrivalId") REFERENCES "CattleArrival"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidTag" ADD CONSTRAINT "RfidTag_arrivalId_fkey" FOREIGN KEY ("arrivalId") REFERENCES "CattleArrival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidTag" ADD CONSTRAINT "RfidTag_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "CattleInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleBatch" ADD CONSTRAINT "CattleBatch_purchasingId_fkey" FOREIGN KEY ("purchasingId") REFERENCES "CattlePurchasing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleBatch" ADD CONSTRAINT "CattleBatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleInventory" ADD CONSTRAINT "CattleInventory_arrivalId_fkey" FOREIGN KEY ("arrivalId") REFERENCES "CattleArrival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleInventory" ADD CONSTRAINT "CattleInventory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CattleBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleInventory" ADD CONSTRAINT "CattleInventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleOverhead" ADD CONSTRAINT "CattleOverhead_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CattleBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleOverhead" ADD CONSTRAINT "CattleOverhead_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "CattleInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleBatchDeduction" ADD CONSTRAINT "CattleBatchDeduction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CattleBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
