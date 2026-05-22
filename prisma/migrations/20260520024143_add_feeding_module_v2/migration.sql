/*
  Warnings:

  - You are about to drop the column `totalKgPerBatch` on the `RationFormula` table. All the data in the column will be lost.
  - You are about to drop the column `feedIngredientId` on the `RationIngredient` table. All the data in the column will be lost.
  - You are about to drop the `FeedIngredient` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[rationFormulaId,itemName]` on the table `RationIngredient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemName` to the `RationIngredient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RationIngredient" DROP CONSTRAINT "RationIngredient_feedIngredientId_fkey";

-- DropIndex
DROP INDEX "FeedConsumptionLog_cattleId_idx";

-- DropIndex
DROP INDEX "FeedingSchedule_rationFormulaId_idx";

-- DropIndex
DROP INDEX "RationIngredient_rationFormulaId_feedIngredientId_key";

-- AlterTable
ALTER TABLE "RationFormula" DROP COLUMN "totalKgPerBatch";

-- AlterTable
ALTER TABLE "RationIngredient" DROP COLUMN "feedIngredientId",
ADD COLUMN     "itemName" TEXT NOT NULL,
ADD COLUMN     "priceSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'KG',
ADD COLUMN     "warehouseId" TEXT,
ALTER COLUMN "pctOfTotal" SET DEFAULT 0;

-- DropTable
DROP TABLE "FeedIngredient";

-- CreateIndex
CREATE INDEX "RationIngredient_itemName_idx" ON "RationIngredient"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "RationIngredient_rationFormulaId_itemName_key" ON "RationIngredient"("rationFormulaId", "itemName");
