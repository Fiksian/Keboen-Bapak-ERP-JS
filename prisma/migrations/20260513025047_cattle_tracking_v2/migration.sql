-- CreateEnum
CREATE TYPE "WeightType" AS ENUM ('BELI', 'TERIMA', 'GRADING', 'PANEN');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('SEHAT', 'SAKIT', 'OBSERVASI', 'KARANTINA');

-- CreateEnum
CREATE TYPE "HPPCategory" AS ENUM ('HARGA_BELI', 'LANDED_COST', 'KARANTINA', 'PAKAN', 'TENAGA_KERJA', 'UTILITAS', 'OVERHEAD', 'LAINNYA');

-- AlterTable
ALTER TABLE "Cattle" ADD COLUMN     "hargaBeliPerKg" DOUBLE PRECISION,
ADD COLUMN     "hargaBeliTotal" DOUBLE PRECISION,
ADD COLUMN     "healthStatus" "HealthStatus" NOT NULL DEFAULT 'SEHAT',
ADD COLUMN     "hppPerEkor" DOUBLE PRECISION,
ADD COLUMN     "hppPerKg" DOUBLE PRECISION,
ADD COLUMN     "lastVaccineDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "susutPct" DOUBLE PRECISION,
ADD COLUMN     "vaccinated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weightBeli" DOUBLE PRECISION,
ADD COLUMN     "weightGrading" DOUBLE PRECISION,
ADD COLUMN     "weightPanen" DOUBLE PRECISION,
ADD COLUMN     "weightTerima" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CattleWeightRecord" (
    "id" TEXT NOT NULL,
    "weightType" "WeightType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "note" TEXT,
    "cattleId" TEXT NOT NULL,

    CONSTRAINT "CattleWeightRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleVaccine" (
    "id" TEXT NOT NULL,
    "vaccineType" TEXT NOT NULL,
    "vaccineDate" TIMESTAMP(3) NOT NULL,
    "doseNumber" INTEGER NOT NULL DEFAULT 1,
    "nextDueDate" TIMESTAMP(3),
    "administeredBy" TEXT,
    "batchNo" TEXT,
    "note" TEXT,
    "cattleId" TEXT NOT NULL,

    CONSTRAINT "CattleVaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleHealthRecord" (
    "id" TEXT NOT NULL,
    "healthStatus" "HealthStatus" NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "treatedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveredAt" TIMESTAMP(3),
    "note" TEXT,
    "cattleId" TEXT NOT NULL,

    CONSTRAINT "CattleHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleTransfer" (
    "id" TEXT NOT NULL,
    "fromWarehouseId" TEXT,
    "toWarehouseId" TEXT NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferredBy" TEXT,
    "reason" TEXT,
    "note" TEXT,
    "cattleId" TEXT NOT NULL,

    CONSTRAINT "CattleTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleHPPComponent" (
    "id" TEXT NOT NULL,
    "category" "HPPCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isPerHead" BOOLEAN NOT NULL DEFAULT false,
    "headCount" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "note" TEXT,
    "cattleId" TEXT,
    "arrivalId" TEXT,

    CONSTRAINT "CattleHPPComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CattleWeightRecord_cattleId_idx" ON "CattleWeightRecord"("cattleId");

-- CreateIndex
CREATE INDEX "CattleWeightRecord_cattleId_weightType_idx" ON "CattleWeightRecord"("cattleId", "weightType");

-- CreateIndex
CREATE INDEX "CattleVaccine_cattleId_idx" ON "CattleVaccine"("cattleId");

-- CreateIndex
CREATE INDEX "CattleHealthRecord_cattleId_idx" ON "CattleHealthRecord"("cattleId");

-- CreateIndex
CREATE INDEX "CattleTransfer_cattleId_idx" ON "CattleTransfer"("cattleId");

-- CreateIndex
CREATE INDEX "CattleTransfer_fromWarehouseId_idx" ON "CattleTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "CattleTransfer_toWarehouseId_idx" ON "CattleTransfer"("toWarehouseId");

-- CreateIndex
CREATE INDEX "CattleHPPComponent_cattleId_idx" ON "CattleHPPComponent"("cattleId");

-- CreateIndex
CREATE INDEX "CattleHPPComponent_arrivalId_idx" ON "CattleHPPComponent"("arrivalId");

-- AddForeignKey
ALTER TABLE "CattleWeightRecord" ADD CONSTRAINT "CattleWeightRecord_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleVaccine" ADD CONSTRAINT "CattleVaccine_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleHealthRecord" ADD CONSTRAINT "CattleHealthRecord_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleTransfer" ADD CONSTRAINT "CattleTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleTransfer" ADD CONSTRAINT "CattleTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleTransfer" ADD CONSTRAINT "CattleTransfer_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleHPPComponent" ADD CONSTRAINT "CattleHPPComponent_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
