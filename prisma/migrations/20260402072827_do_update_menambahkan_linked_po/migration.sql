/*
  Warnings:

  - You are about to drop the column `linkedPOId` on the `DeliveryOrder` table. All the data in the column will be lost.
  - You are about to drop the column `linkedPONo` on the `DeliveryOrder` table. All the data in the column will be lost.
  - Added the required column `supplier` to the `DeliveryOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliveryOrder" DROP COLUMN "linkedPOId",
DROP COLUMN "linkedPONo",
ADD COLUMN     "supplier" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DeliveryOrderItem" ADD COLUMN     "category" TEXT DEFAULT '',
ADD COLUMN     "stockName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "type" TEXT DEFAULT 'STOCKS',
ALTER COLUMN "description" SET DEFAULT '';
