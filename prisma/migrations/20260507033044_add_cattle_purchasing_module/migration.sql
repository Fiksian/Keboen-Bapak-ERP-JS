-- CreateEnum
CREATE TYPE "CattleDOStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'PARTIAL', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CattlePOStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CattleBreed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CattleBreed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleDeliveryOrder" (
    "id" TEXT NOT NULL,
    "doNo" TEXT NOT NULL,
    "title" TEXT,
    "expectedDate" TIMESTAMP(3),
    "notes" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedNotes" TEXT,
    "status" "CattleDOStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattleDeliveryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleDOItem" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "breedId" TEXT,
    "jenisSapi" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'CAMPUR',
    "headRequired" INTEGER NOT NULL DEFAULT 0,
    "weightRequiredKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "headOrdered" INTEGER NOT NULL DEFAULT 0,
    "weightOrderedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimasiHargaPerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimasiTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattleDOItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattlePurchasing" (
    "id" TEXT NOT NULL,
    "noPO" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorCountry" TEXT NOT NULL DEFAULT 'Australia',
    "vendorEksportir" TEXT,
    "totalHeadOrdered" INTEGER NOT NULL DEFAULT 0,
    "totalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerKgIDR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerHeadUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biayaBongkar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biayaTracking" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biayaKarantina" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biayaLainLain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppPerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEstimasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" "CattlePOStatus" NOT NULL DEFAULT 'DRAFT',
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "warehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattlePurchasing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattlePOItem" (
    "id" TEXT NOT NULL,
    "purchasingId" TEXT NOT NULL,
    "doItemId" TEXT,
    "breedId" TEXT,
    "jenisSapi" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'CAMPUR',
    "headOrdered" INTEGER NOT NULL DEFAULT 0,
    "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHarga" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerHeadUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattlePOItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleArrival" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "arrivalNo" TEXT NOT NULL,
    "suratJalan" TEXT,
    "vehicleNo" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT NOT NULL,
    "notes" TEXT,
    "totalHeadArrived" INTEGER NOT NULL DEFAULT 0,
    "totalWeightArrived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattleArrival_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleBatch" (
    "id" TEXT NOT NULL,
    "batchNo" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "jenisSapi" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'CAMPUR',
    "headInitial" INTEGER NOT NULL DEFAULT 0,
    "headRemaining" INTEGER NOT NULL DEFAULT 0,
    "totalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weightRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warehouseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CattleBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CattleBreed_name_key" ON "CattleBreed"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CattleDeliveryOrder_doNo_key" ON "CattleDeliveryOrder"("doNo");

-- CreateIndex
CREATE INDEX "CattleDeliveryOrder_status_idx" ON "CattleDeliveryOrder"("status");

-- CreateIndex
CREATE INDEX "CattleDeliveryOrder_createdAt_idx" ON "CattleDeliveryOrder"("createdAt");

-- CreateIndex
CREATE INDEX "CattleDOItem_deliveryOrderId_idx" ON "CattleDOItem"("deliveryOrderId");

-- CreateIndex
CREATE INDEX "CattlePurchasing_status_idx" ON "CattlePurchasing"("status");

-- CreateIndex
CREATE INDEX "CattlePurchasing_isReceived_idx" ON "CattlePurchasing"("isReceived");

-- CreateIndex
CREATE INDEX "CattlePurchasing_createdAt_idx" ON "CattlePurchasing"("createdAt");

-- CreateIndex
CREATE INDEX "CattlePOItem_purchasingId_idx" ON "CattlePOItem"("purchasingId");

-- CreateIndex
CREATE INDEX "CattlePOItem_doItemId_idx" ON "CattlePOItem"("doItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CattleArrival_arrivalNo_key" ON "CattleArrival"("arrivalNo");

-- CreateIndex
CREATE INDEX "CattleArrival_poId_idx" ON "CattleArrival"("poId");

-- CreateIndex
CREATE INDEX "CattleArrival_arrivalNo_idx" ON "CattleArrival"("arrivalNo");

-- CreateIndex
CREATE UNIQUE INDEX "CattleBatch_batchNo_key" ON "CattleBatch"("batchNo");

-- CreateIndex
CREATE INDEX "CattleBatch_poId_idx" ON "CattleBatch"("poId");

-- CreateIndex
CREATE INDEX "CattleBatch_status_idx" ON "CattleBatch"("status");

-- AddForeignKey
ALTER TABLE "CattleDOItem" ADD CONSTRAINT "CattleDOItem_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "CattleDeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleDOItem" ADD CONSTRAINT "CattleDOItem_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "CattleBreed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattlePurchasing" ADD CONSTRAINT "CattlePurchasing_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattlePOItem" ADD CONSTRAINT "CattlePOItem_purchasingId_fkey" FOREIGN KEY ("purchasingId") REFERENCES "CattlePurchasing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattlePOItem" ADD CONSTRAINT "CattlePOItem_doItemId_fkey" FOREIGN KEY ("doItemId") REFERENCES "CattleDOItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattlePOItem" ADD CONSTRAINT "CattlePOItem_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "CattleBreed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleArrival" ADD CONSTRAINT "CattleArrival_poId_fkey" FOREIGN KEY ("poId") REFERENCES "CattlePurchasing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CattleBatch" ADD CONSTRAINT "CattleBatch_poId_fkey" FOREIGN KEY ("poId") REFERENCES "CattlePurchasing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CattleBreed" (id, name, description, "createdAt") VALUES
  (gen_random_uuid(), 'Limousin',   'Sapi potong impor asal Prancis',     NOW()),
  (gen_random_uuid(), 'Simental',   'Sapi potong impor asal Swiss',        NOW()),
  (gen_random_uuid(), 'BX',         'Brahman Cross, sapi lokal Australia', NOW()),
  (gen_random_uuid(), 'Brahman',    'Sapi impor Amerika',                  NOW()),
  (gen_random_uuid(), 'Angus',      'Sapi premium asal Skotlandia',        NOW()),
  (gen_random_uuid(), 'Ongole',     'Sapi PO lokal',                       NOW()),
  (gen_random_uuid(), 'Wagyu',      'Sapi premium Jepang',                 NOW()),
  (gen_random_uuid(), 'Campuran',   'Campuran / Tidak ditentukan',         NOW())
ON CONFLICT (name) DO NOTHING;