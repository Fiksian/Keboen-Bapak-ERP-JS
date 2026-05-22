-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ON_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" TEXT,
    "totalEkor" INTEGER NOT NULL DEFAULT 0,
    "totalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING_SALES',
    "paymentMethod" TEXT DEFAULT 'TRANSFER',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "salesApprovedBy" TEXT,
    "salesApprovedAt" TIMESTAMP(3),
    "adminApprovedBy" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "supervisorApprovedBy" TEXT,
    "supervisorApprovedAt" TIMESTAMP(3),
    "managerApprovedBy" TEXT,
    "managerApprovedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedNotes" TEXT,
    "warehouseId" TEXT,
    "notes" TEXT,
    "deliveryAddress" TEXT,
    "createdBy" TEXT,
    "isCattleReleased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "cattleId" TEXT,
    "rfidNo" TEXT NOT NULL,
    "finalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hppPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marginPerEkor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breed" TEXT,
    "notes" TEXT,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryTracking" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "suratJalanNo" TEXT NOT NULL,
    "driverName" TEXT,
    "vehicleNo" TEXT,
    "vehicleCapacity" INTEGER,
    "helperName" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "departedAt" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "originAddress" TEXT,
    "destAddress" TEXT,
    "notes" TEXT,
    "receivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_invoiceNo_key" ON "SalesOrder"("invoiceNo");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "SalesOrder_warehouseId_idx" ON "SalesOrder"("warehouseId");

-- CreateIndex
CREATE INDEX "SalesOrder_createdAt_idx" ON "SalesOrder"("createdAt");

-- CreateIndex
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_cattleId_idx" ON "SalesOrderItem"("cattleId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_rfidNo_idx" ON "SalesOrderItem"("rfidNo");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTracking_salesOrderId_key" ON "DeliveryTracking"("salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTracking_suratJalanNo_key" ON "DeliveryTracking"("suratJalanNo");

-- CreateIndex
CREATE INDEX "DeliveryTracking_status_idx" ON "DeliveryTracking"("status");

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryTracking" ADD CONSTRAINT "DeliveryTracking_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
