/*
  Warnings:

  - You are about to drop the column `warehouseId` on the `DeliveryOrderItem` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DeliveryOrderItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `DeliveryOrderItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `DeliveryOrderItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DeliveryOrderItem" DROP CONSTRAINT "DeliveryOrderItem_warehouseId_fkey";

-- DropIndex
DROP INDEX "DeliveryOrder_status_idx";

-- DropIndex
DROP INDEX "DeliveryOrderItem_deliveryOrderId_idx";

-- DropIndex
DROP INDEX "Purchasing_deliveryOrderItemId_idx";

-- AlterTable
ALTER TABLE "DeliveryOrderItem" DROP COLUMN "warehouseId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "itemName" DROP DEFAULT;
