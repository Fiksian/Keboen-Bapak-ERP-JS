-- ============================================================
-- Migration: do_first_refactor (FIXED SYNTAX)
-- ============================================================

DO $$
BEGIN
  -- ── Step 1: Tambah kolom pada DeliveryOrderItem ────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrderItem' AND column_name='qtyOrdered') THEN
    ALTER TABLE "DeliveryOrderItem" ADD COLUMN "qtyOrdered" DOUBLE PRECISION NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrder' AND column_name='title') THEN
    ALTER TABLE "DeliveryOrder" ADD COLUMN "title" TEXT;
  END IF;

  -- ── Step 2: Hapus & Rename kolom lama di DeliveryOrderItem ─────────────
  -- Hapus Constraint purchasingId jika ada
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='DeliveryOrderItem_purchasingId_fkey') THEN
    ALTER TABLE "DeliveryOrderItem" DROP CONSTRAINT "DeliveryOrderItem_purchasingId_fkey";
  END IF;

  -- Hapus kolom purchasingId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrderItem' AND column_name='purchasingId') THEN
    ALTER TABLE "DeliveryOrderItem" DROP COLUMN "purchasingId";
  END IF;

  -- Hapus itemSnapshot & supplierSnapshot
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrderItem' AND column_name='itemSnapshot') THEN
    ALTER TABLE "DeliveryOrderItem" DROP COLUMN "itemSnapshot";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrderItem' AND column_name='supplierSnapshot') THEN
    ALTER TABLE "DeliveryOrderItem" DROP COLUMN "supplierSnapshot";
  END IF;

  -- Rename qtyDO ke qtyRequired
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrderItem' AND column_name='qtyDO') THEN
    ALTER TABLE "DeliveryOrderItem" RENAME COLUMN "qtyDO" TO "qtyRequired";
  END IF;

  -- Tambah itemName
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrderItem' AND column_name='itemName') THEN
    ALTER TABLE "DeliveryOrderItem" ADD COLUMN "itemName" TEXT NOT NULL DEFAULT '';
  END IF;

  -- ── Step 3: Purchasing Relation ─────────────────────────────────────────
  -- Tambah deliveryOrderItemId ke Purchasing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Purchasing' AND column_name='deliveryOrderItemId') THEN
    ALTER TABLE "Purchasing" ADD COLUMN "deliveryOrderItemId" TEXT;
  END IF;

  -- Tambah Foreign Key secara manual jika belum ada
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='Purchasing_deliveryOrderItemId_fkey') THEN
    ALTER TABLE "Purchasing" 
    ADD CONSTRAINT "Purchasing_deliveryOrderItemId_fkey" 
    FOREIGN KEY ("deliveryOrderItemId") REFERENCES "DeliveryOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- ── Step 4: Bersihkan DeliveryOrder ─────────────────────────────────────
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrder' AND column_name='supplier') THEN
    ALTER TABLE "DeliveryOrder" DROP COLUMN "supplier";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='DeliveryOrder' AND column_name='linkedPOId') THEN
    ALTER TABLE "DeliveryOrder" DROP COLUMN "linkedPOId";
  END IF;
END $$;

-- ── Step 5: Update status & Index ──────────────────────────────────────────
UPDATE "DeliveryOrder" SET "status" = 'PARTIAL' WHERE "status" = 'LINKED';

-- PostgreSQL mendukung IF NOT EXISTS untuk Index
CREATE INDEX IF NOT EXISTS "Purchasing_deliveryOrderItemId_idx" ON "Purchasing"("deliveryOrderItemId");
CREATE INDEX IF NOT EXISTS "DeliveryOrderItem_deliveryOrderId_idx" ON "DeliveryOrderItem"("deliveryOrderId");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_status_idx" ON "DeliveryOrder"("status");

-- ── Step 6: Sync Data ──────────────────────────────────────────────────────
UPDATE "DeliveryOrderItem" doi
SET "qtyOrdered" = COALESCE((
  SELECT SUM(p.qty)
  FROM "Purchasing" p
  WHERE p."deliveryOrderItemId" = doi.id
    AND p."status" != 'REJECTED'
), 0);