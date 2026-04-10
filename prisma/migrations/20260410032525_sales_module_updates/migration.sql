-- ============================================================
-- Migration: sales_module_upgrade
-- Menambahkan field baru ke Penjualan, PenjualanItem,
-- dan membuat tabel SalesQuotation baru.
-- ============================================================

-- Step 1: Tambah field baru ke Penjualan
ALTER TABLE "Penjualan"
  ADD COLUMN IF NOT EXISTS "quotationId"      TEXT,
  ADD COLUMN IF NOT EXISTS "notes"            TEXT,
  ADD COLUMN IF NOT EXISTS "discount"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discountPct"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxPct"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxAmount"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "subtotal"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shippingCost"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentMethod"    TEXT DEFAULT 'CASH',
  ADD COLUMN IF NOT EXISTS "paidAt"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dueDate"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "salesNotes"       TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryAddress"  TEXT,
  ADD COLUMN IF NOT EXISTS "createdBy"        TEXT;

-- Step 2: Sync subtotal untuk data lama (subtotal = totalAmount jika ada)
UPDATE "Penjualan" SET "subtotal" = "totalAmount" WHERE "subtotal" = 0;

-- Step 3: Tambah field baru ke PenjualanItem
ALTER TABLE "PenjualanItem"
  ADD COLUMN IF NOT EXISTS "discount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "subtotal"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notes"      TEXT;

-- Sync subtotal item lama: subtotal = quantity * price
UPDATE "PenjualanItem" SET "subtotal" = "quantity" * "price" WHERE "subtotal" = 0;

-- Step 4: Buat tabel SalesQuotation
CREATE TABLE IF NOT EXISTS "SalesQuotation" (
  "id"            TEXT         NOT NULL,
  "quotationNo"   TEXT         NOT NULL,
  "customerId"    TEXT,
  "status"        TEXT         NOT NULL DEFAULT 'DRAFT',
  "validUntil"    TIMESTAMP(3),
  "notes"         TEXT,
  "subtotal"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountPct"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxPct"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmount"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdBy"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesQuotation_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "SalesQuotation_quotationNo_key" UNIQUE ("quotationNo")
);

-- Step 5: Buat tabel SalesQuotationItem
CREATE TABLE IF NOT EXISTS "SalesQuotationItem" (
  "id"            TEXT         NOT NULL,
  "quotationId"   TEXT         NOT NULL,
  "productName"   TEXT         NOT NULL,
  "quantity"      DOUBLE PRECISION NOT NULL,
  "unit"          TEXT         NOT NULL DEFAULT 'Unit',
  "price"         DOUBLE PRECISION NOT NULL,
  "discount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "subtotal"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes"         TEXT,
  CONSTRAINT "SalesQuotationItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SalesQuotationItem_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 6: FK SalesQuotation ke Contact
ALTER TABLE "SalesQuotation"
  ADD CONSTRAINT IF NOT EXISTS "SalesQuotation_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: FK Penjualan ke SalesQuotation
ALTER TABLE "Penjualan"
  ADD CONSTRAINT IF NOT EXISTS "Penjualan_quotationId_fkey"
  FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 8: Index
CREATE INDEX IF NOT EXISTS "SalesQuotation_status_idx"     ON "SalesQuotation"("status");
CREATE INDEX IF NOT EXISTS "SalesQuotation_customerId_idx"  ON "SalesQuotation"("customerId");
CREATE INDEX IF NOT EXISTS "Penjualan_quotationId_idx"      ON "Penjualan"("quotationId");
CREATE INDEX IF NOT EXISTS "Penjualan_status_idx"           ON "Penjualan"("status");
CREATE INDEX IF NOT EXISTS "Penjualan_paymentMethod_idx"    ON "Penjualan"("paymentMethod");

-- ============================================================
-- Cara pakai:
--   npx dotenv -e .env.local prisma migrate dev --create-only --name sales_module_upgrade
--   → Copy isi file ini ke migration file yang dibuat Prisma
--   npx dotenv -e .env.local prisma migrate dev
-- ============================================================
