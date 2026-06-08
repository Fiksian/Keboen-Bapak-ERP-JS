/*
  Warnings:

  - You are about to drop the `CattleVaccine` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CattleVaccine" DROP CONSTRAINT "CattleVaccine_cattleId_fkey";

-- AlterTable
ALTER TABLE "Cattle" ADD COLUMN     "lastMedicationDate" TIMESTAMP(3);

-- DropTable
DROP TABLE "CattleVaccine";

-- CreateTable
CREATE TABLE "CattleMedication" (
    "id" TEXT NOT NULL,
    "medicationType" TEXT NOT NULL DEFAULT 'VAKSIN',
    "productName" TEXT NOT NULL,
    "vaccineType" TEXT,
    "doseNumber" INTEGER NOT NULL DEFAULT 1,
    "nextDueDate" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'ml',
    "indication" TEXT,
    "givenDate" TIMESTAMP(3) NOT NULL,
    "administeredBy" TEXT,
    "batchNo" TEXT,
    "note" TEXT,
    "cattleId" TEXT NOT NULL,

    CONSTRAINT "CattleMedication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CattleMedication_cattleId_idx" ON "CattleMedication"("cattleId");

-- CreateIndex
CREATE INDEX "CattleMedication_medicationType_idx" ON "CattleMedication"("medicationType");

-- CreateIndex
CREATE INDEX "CattleMedication_givenDate_idx" ON "CattleMedication"("givenDate");

-- AddForeignKey
ALTER TABLE "CattleMedication" ADD CONSTRAINT "CattleMedication_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
