/*
  Warnings:

  - Made the column `warehouseId` on table `Receipt` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouseId` on table `Stock` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_warehouseId_fkey";

-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "warehouseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Stock" ALTER COLUMN "warehouseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
