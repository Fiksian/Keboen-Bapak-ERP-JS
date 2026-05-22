-- CreateEnum
CREATE TYPE "FeedingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "capacity" INTEGER;

-- CreateTable
CREATE TABLE "FeedIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PAKAN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RationFormula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalKgPerBatch" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "totalCostPerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetKgPerHead" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RationFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RationIngredient" (
    "id" TEXT NOT NULL,
    "rationFormulaId" TEXT NOT NULL,
    "feedIngredientId" TEXT NOT NULL,
    "qtyKgPerBatch" DOUBLE PRECISION NOT NULL,
    "pctOfTotal" DOUBLE PRECISION NOT NULL,
    "costContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RationIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingSchedule" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "label" TEXT,
    "daysOfWeek" TEXT NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI,SAT,SUN',
    "rationFormulaId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "targetKgPerHead" DOUBLE PRECISION,
    "headCount" INTEGER,
    "totalKgTarget" DOUBLE PRECISION,
    "status" "FeedingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedConsumptionLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" TEXT,
    "cattleId" TEXT,
    "rationFormulaId" TEXT,
    "scheduleId" TEXT,
    "amountGiven" DOUBLE PRECISION NOT NULL,
    "amountWasted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "headCount" INTEGER,
    "kgPerHead" DOUBLE PRECISION,
    "estimatedCost" DOUBLE PRECISION,
    "deductionRef" TEXT,
    "isStockDeducted" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedConsumptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedIngredient_name_key" ON "FeedIngredient"("name");

-- CreateIndex
CREATE INDEX "FeedIngredient_name_idx" ON "FeedIngredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RationFormula_name_key" ON "RationFormula"("name");

-- CreateIndex
CREATE INDEX "RationIngredient_rationFormulaId_idx" ON "RationIngredient"("rationFormulaId");

-- CreateIndex
CREATE UNIQUE INDEX "RationIngredient_rationFormulaId_feedIngredientId_key" ON "RationIngredient"("rationFormulaId", "feedIngredientId");

-- CreateIndex
CREATE INDEX "FeedingSchedule_warehouseId_idx" ON "FeedingSchedule"("warehouseId");

-- CreateIndex
CREATE INDEX "FeedingSchedule_rationFormulaId_idx" ON "FeedingSchedule"("rationFormulaId");

-- CreateIndex
CREATE INDEX "FeedingSchedule_status_idx" ON "FeedingSchedule"("status");

-- CreateIndex
CREATE INDEX "FeedConsumptionLog_warehouseId_idx" ON "FeedConsumptionLog"("warehouseId");

-- CreateIndex
CREATE INDEX "FeedConsumptionLog_rationFormulaId_idx" ON "FeedConsumptionLog"("rationFormulaId");

-- CreateIndex
CREATE INDEX "FeedConsumptionLog_date_idx" ON "FeedConsumptionLog"("date");

-- CreateIndex
CREATE INDEX "FeedConsumptionLog_cattleId_idx" ON "FeedConsumptionLog"("cattleId");

-- AddForeignKey
ALTER TABLE "RationIngredient" ADD CONSTRAINT "RationIngredient_rationFormulaId_fkey" FOREIGN KEY ("rationFormulaId") REFERENCES "RationFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RationIngredient" ADD CONSTRAINT "RationIngredient_feedIngredientId_fkey" FOREIGN KEY ("feedIngredientId") REFERENCES "FeedIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingSchedule" ADD CONSTRAINT "FeedingSchedule_rationFormulaId_fkey" FOREIGN KEY ("rationFormulaId") REFERENCES "RationFormula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingSchedule" ADD CONSTRAINT "FeedingSchedule_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedConsumptionLog" ADD CONSTRAINT "FeedConsumptionLog_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedConsumptionLog" ADD CONSTRAINT "FeedConsumptionLog_rationFormulaId_fkey" FOREIGN KEY ("rationFormulaId") REFERENCES "RationFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedConsumptionLog" ADD CONSTRAINT "FeedConsumptionLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "FeedingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
