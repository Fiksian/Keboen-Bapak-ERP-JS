-- ============================================================
-- Migration: add_sttb_multi_stage_approval
-- Perubahan:
--   1. Receipt.warehouseId menjadi nullable (gudang diisi nanti)
--   2. Tambah model STTB baru
-- ============================================================

-- Step 1: Jadikan Receipt.warehouseId nullable
-- (dulunya NOT NULL — sekarang boleh NULL karena gudang diisi saat STTB approved)
ALTER TABLE "Receipt"
  ALTER COLUMN "warehouseId" DROP NOT NULL;

-- Step 2: Buat tabel STTB
CREATE TABLE "STTB" (
  "id"                    TEXT        NOT NULL,
  "sttbNo"                TEXT        NOT NULL,
  "receiptId"             TEXT        NOT NULL,
  "purchasingId"          TEXT        NOT NULL,
  "status"                TEXT        NOT NULL DEFAULT 'PENDING_QC',

  -- Stage 1: QC (auto-filled saat arrival)
  "qcApprovedBy"          TEXT,
  "qcApprovedAt"          TIMESTAMP(3),
  "qcNotes"               TEXT,

  -- Stage 2: Supervisor
  "supervisorApprovedBy"  TEXT,
  "supervisorApprovedAt"  TIMESTAMP(3),
  "supervisorNotes"       TEXT,

  -- Stage 3: Manager (final)
  "managerApprovedBy"     TEXT,
  "managerApprovedAt"     TIMESTAMP(3),
  "managerNotes"          TEXT,

  -- Gudang tujuan — diisi oleh Manager
  "warehouseId"           TEXT,

  -- Apakah stok sudah dicatat
  "stockCommitted"        BOOLEAN     NOT NULL DEFAULT false,
  "stockCommittedAt"      TIMESTAMP(3),

  -- Jika ditolak
  "rejectedBy"            TEXT,
  "rejectedAt"            TIMESTAMP(3),
  "rejectedNotes"         TEXT,

  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,

  CONSTRAINT "STTB_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "STTB_sttbNo_key"     UNIQUE ("sttbNo"),
  CONSTRAINT "STTB_receiptId_key"  UNIQUE ("receiptId"),
  CONSTRAINT "STTB_purchasingId_key" UNIQUE ("purchasingId")
);

-- Step 3: Foreign keys STTB
ALTER TABLE "STTB"
  ADD CONSTRAINT "STTB_receiptId_fkey"
    FOREIGN KEY ("receiptId")   REFERENCES "Receipt"("id")    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "STTB"
  ADD CONSTRAINT "STTB_purchasingId_fkey"
    FOREIGN KEY ("purchasingId") REFERENCES "Purchasing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "STTB"
  ADD CONSTRAINT "STTB_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")   ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Index untuk query cepat per status
CREATE INDEX "STTB_status_idx"        ON "STTB"("status");
CREATE INDEX "STTB_purchasingId_idx"  ON "STTB"("purchasingId");
CREATE INDEX "STTB_receiptId_idx"     ON "STTB"("receiptId");

-- ============================================================
-- Cara pakai:
--   npx dotenv -e .env.local prisma migrate dev --create-only --name add_sttb_approval
--   → Copy isi file ini ke dalam migration file yang dibuat Prisma
--   npx dotenv -e .env.local prisma migrate dev
-- ============================================================
