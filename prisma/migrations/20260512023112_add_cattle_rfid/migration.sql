-- CreateEnum
CREATE TYPE "CattleStatus" AS ENUM ('ARRIVAL', 'IN_KANDANG', 'SOLD');

-- DropIndex
DROP INDEX "CattleInventory_status_idx";

-- AlterTable
ALTER TABLE "CattleInventory" ADD COLUMN     "lastScanAt" TIMESTAMP(3),
ADD COLUMN     "lastWeightDate" TIMESTAMP(3),
ADD COLUMN     "locationStatus" "CattleStatus" NOT NULL DEFAULT 'ARRIVAL';

-- CreateTable
CREATE TABLE "Cattle" (
    "id" TEXT NOT NULL,
    "rfidNo" TEXT NOT NULL,
    "name" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CattleStatus" NOT NULL DEFAULT 'ARRIVAL',
    "lastWeightDate" TIMESTAMP(3),
    "lastScanAt" TIMESTAMP(3),
    "warehouseId" TEXT,
    "arrivalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleWeightHistory" (
    "id" SERIAL NOT NULL,
    "cattleId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "note" TEXT,
    "sourceFile" TEXT,

    CONSTRAINT "CattleWeightHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cattle_rfidNo_key" ON "Cattle"("rfidNo");

-- CreateIndex
CREATE INDEX "Cattle_rfidNo_idx" ON "Cattle"("rfidNo");

-- CreateIndex
CREATE INDEX "Cattle_warehouseId_idx" ON "Cattle"("warehouseId");

-- CreateIndex
CREATE INDEX "Cattle_status_idx" ON "Cattle"("status");

-- CreateIndex
CREATE INDEX "Cattle_arrivalId_idx" ON "Cattle"("arrivalId");

-- CreateIndex
CREATE INDEX "CattleWeightHistory_cattleId_idx" ON "CattleWeightHistory"("cattleId");

-- CreateIndex
CREATE INDEX "CattleWeightHistory_recordedAt_idx" ON "CattleWeightHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "CattleInventory_locationStatus_idx" ON "CattleInventory"("locationStatus");

-- CreateIndex
CREATE INDEX "Warehouse_name_idx" ON "Warehouse"("name");

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_arrivalId_fkey" FOREIGN KEY ("arrivalId") REFERENCES "CattleArrival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleWeightHistory" ADD CONSTRAINT "CattleWeightHistory_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
