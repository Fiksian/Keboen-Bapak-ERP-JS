/*
  Warnings:

  - A unique constraint covering the columns `[cattleId]` on the table `CattleInventory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CattleInventory" ADD COLUMN     "cattleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CattleInventory_cattleId_key" ON "CattleInventory"("cattleId");

-- AddForeignKey
ALTER TABLE "CattleInventory" ADD CONSTRAINT "CattleInventory_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
