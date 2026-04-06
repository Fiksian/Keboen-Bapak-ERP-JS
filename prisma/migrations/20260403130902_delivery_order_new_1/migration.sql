/*
  Warnings:

  - You are about to drop the column `qty` on the `DeliveryOrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeliveryOrderItem" DROP COLUMN "qty",
ADD COLUMN     "category" TEXT DEFAULT '',
ADD COLUMN     "type" TEXT DEFAULT 'STOCKS',
ALTER COLUMN "qtyDO" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Purchasing" ADD COLUMN     "notes" TEXT;
