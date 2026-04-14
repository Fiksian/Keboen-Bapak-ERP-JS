-- ============================================================
-- Migration: fifo_batch_tracking
-- Membuat sistem FIFO batch untuk traceability stok
-- ============================================================

-- Step 1: Buat tabel StockBatch
CREATE TABLE IF NOT EXISTS "StockBatch" (
  "id"           TEXT         NOT NULL,
  "batchNo"      TEXT         NOT NULL,
  "itemName"     TEXT         NOT NULL,
  "warehouseId"  TEXT         NOT NULL,
  "purchasingId" TEXT,
  "receiptId"    TEXT,
  "sttbId"       TEXT,
  "supplierName" TEXT,
  "noPO"         TEXT,
  "suratJalan"   TEXT,
  "qtyInitial"   DOUBLE PRECISION NOT NULL,
  "qtyRemaining" DOUBLE PRECISION NOT NULL,
  "unit"         TEXT         NOT NULL DEFAULT 'KG',
  "category"     TEXT         NOT NULL DEFAULT 'General',
  "type"         TEXT         NOT NULL DEFAULT 'STOCKS',
  "price"        TEXT,
  "condition"    TEXT                  DEFAULT 'GOOD',
  "notes"        TEXT,
  "status"       TEXT         NOT NULL DEFAULT 'ACTIVE',
  "receivedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "depletedAt"   TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StockBatch_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "StockBatch_batchNo_key" UNIQUE ("batchNo")
);

-- Step 2: Buat tabel BatchDeduction
CREATE TABLE IF NOT EXISTS "BatchDeduction" (
  "id"            TEXT         NOT NULL,
  "batchId"       TEXT         NOT NULL,
  "referenceId"   TEXT,
  "referenceType" TEXT,
  "referenceNo"   TEXT,
  "qtyDeducted"   DOUBLE PRECISION NOT NULL,
  "unit"          TEXT         NOT NULL DEFAULT 'KG',
  "deductedBy"    TEXT,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BatchDeduction_pkey" PRIMARY KEY ("id")
);

-- Step 3: Foreign keys StockBatch
ALTER TABLE "StockBatch"
  ADD CONSTRAINT "StockBatch_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockBatch"
  ADD CONSTRAINT "StockBatch_purchasingId_fkey"
    FOREIGN KEY ("purchasingId") REFERENCES "Purchasing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockBatch"
  ADD CONSTRAINT "StockBatch_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockBatch"
  ADD CONSTRAINT "StockBatch_sttbId_fkey"
    FOREIGN KEY ("sttbId") REFERENCES "STTB"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Foreign key BatchDeduction → StockBatch
ALTER TABLE "BatchDeduction"
  ADD CONSTRAINT "BatchDeduction_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Tambah kolom batchId ke History (opsional, untuk link ke batch)
ALTER TABLE "History"
  ADD COLUMN IF NOT EXISTS "batchId" TEXT;

-- Step 6: Indexes untuk performa FIFO query
CREATE INDEX IF NOT EXISTS "StockBatch_itemName_warehouseId_status_idx"
  ON "StockBatch"("itemName", "warehouseId", "status");

CREATE INDEX IF NOT EXISTS "StockBatch_receivedAt_idx"
  ON "StockBatch"("receivedAt");

CREATE INDEX IF NOT EXISTS "StockBatch_status_idx"
  ON "StockBatch"("status");

CREATE INDEX IF NOT EXISTS "BatchDeduction_batchId_idx"
  ON "BatchDeduction"("batchId");

CREATE INDEX IF NOT EXISTS "BatchDeduction_referenceId_idx"
  ON "BatchDeduction"("referenceId");

-- Step 7: Seed batch dari data Stock yang sudah ada (migrasi data lama)
-- Setiap record Stock yang ada akan dibuatkan satu batch "legacy"
-- dengan tanggal receivedAt = updatedAt dan supplier = 'LEGACY DATA'
INSERT INTO "StockBatch" (
  "id", "batchNo", "itemName", "warehouseId",
  "qtyInitial", "qtyRemaining", "unit", "category", "type", "price",
  "status", "receivedAt", "createdAt", "updatedAt",
  "supplierName", "notes"
)
SELECT
  gen_random_uuid()::TEXT,
  'BATCH/LEGACY/' || LPAD(ROW_NUMBER() OVER (ORDER BY s."updatedAt") ::TEXT, 4, '0'),
  s."name",
  s."warehouseId",
  s."stock",
  s."stock",
  s."unit",
  s."category",
  s."type",
  s."price",
  CASE WHEN s."stock" <= 0 THEN 'DEPLETED' ELSE 'ACTIVE' END,
  COALESCE(s."updatedAt", NOW()),
  NOW(),
  NOW(),
  'LEGACY DATA',
  'Batch dibuat otomatis dari data stok lama saat migrasi ke sistem FIFO'
FROM "Stock" s
WHERE s."stock" > 0
ON CONFLICT DO NOTHING;

-- ============================================================
-- Cara pakai:
--   npx dotenv -e .env.local prisma migrate dev --create-only --name fifo_batch_tracking
--   → Copy isi file ini ke migration file yang dibuat Prisma
--   npx dotenv -e .env.local prisma migrate dev
-- ============================================================
