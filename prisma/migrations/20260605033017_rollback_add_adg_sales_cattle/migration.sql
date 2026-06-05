/*
  Warnings:

  - You are about to drop the column `arrivalDate` on the `Cattle` table. All the data in the column will be lost.
  - You are about to drop the column `genderType` on the `Cattle` table. All the data in the column will be lost.
  - You are about to drop the column `defaultADG` on the `CattleBreed` table. All the data in the column will be lost.
  - You are about to drop the column `avgWeightShipped` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `countBull` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `countHeifer` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `countSteer` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `remainingStock` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the column `adgEstWeight` on the `SalesOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `genderType` on the `SalesOrderItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Cattle_genderType_idx";

-- AlterTable
ALTER TABLE "Cattle" DROP COLUMN "arrivalDate",
DROP COLUMN "genderType";

-- AlterTable
ALTER TABLE "CattleBreed" DROP COLUMN "defaultADG";

-- AlterTable
ALTER TABLE "SalesOrder" DROP COLUMN "avgWeightShipped",
DROP COLUMN "countBull",
DROP COLUMN "countHeifer",
DROP COLUMN "countSteer",
DROP COLUMN "remainingStock";

-- AlterTable
ALTER TABLE "SalesOrderItem" DROP COLUMN "adgEstWeight",
DROP COLUMN "genderType";

-- DropEnum
DROP TYPE "GenderType";
