/*
  Warnings:

  - You are about to drop the `STTB` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `warehouseId` on table `Receipt` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "STTB" DROP CONSTRAINT "STTB_purchasingId_fkey";

-- DropForeignKey
ALTER TABLE "STTB" DROP CONSTRAINT "STTB_receiptId_fkey";

-- DropForeignKey
ALTER TABLE "STTB" DROP CONSTRAINT "STTB_warehouseId_fkey";

-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "warehouseId" SET NOT NULL;

-- DropTable
DROP TABLE "STTB";

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
