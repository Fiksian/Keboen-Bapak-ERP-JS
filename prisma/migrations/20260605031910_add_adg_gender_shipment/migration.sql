-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('STEER', 'HEIFER', 'BULL', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Cattle" ADD COLUMN     "arrivalDate" TIMESTAMP(3),
ADD COLUMN     "genderType" "GenderType" NOT NULL DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "CattleBreed" ADD COLUMN     "defaultADG" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "avgWeightShipped" DOUBLE PRECISION,
ADD COLUMN     "countBull" INTEGER,
ADD COLUMN     "countHeifer" INTEGER,
ADD COLUMN     "countSteer" INTEGER,
ADD COLUMN     "remainingStock" INTEGER;

-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "adgEstWeight" DOUBLE PRECISION,
ADD COLUMN     "genderType" "GenderType";

-- CreateIndex
CREATE INDEX "Cattle_genderType_idx" ON "Cattle"("genderType");
