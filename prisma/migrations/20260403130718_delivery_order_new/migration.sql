-- ============================================================
-- Migration: delivery_order_new
-- Menangani 6 baris existing di DeliveryOrderItem
-- ============================================================

-- Step 1: Hapus kolom lama yang sudah tidak dipakai
ALTER TABLE "DeliveryOrderItem" DROP COLUMN IF EXISTS "description";
ALTER TABLE "DeliveryOrderItem" DROP COLUMN IF EXISTS "stockName";
ALTER TABLE "DeliveryOrderItem" DROP COLUMN IF EXISTS "category";
ALTER TABLE "DeliveryOrderItem" DROP COLUMN IF EXISTS "type";

-- Step 2: Tambah kolom baru dengan DEFAULT sementara agar tidak error
-- (data lama akan diisi placeholder, nanti bisa dibersihkan dari UI)

ALTER TABLE "DeliveryOrderItem"
  ADD COLUMN "itemSnapshot"     TEXT NOT NULL DEFAULT 'LEGACY_ITEM',
  ADD COLUMN "supplierSnapshot" TEXT NOT NULL DEFAULT 'LEGACY_SUPPLIER',
  ADD COLUMN "qtyDO"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "warehouseId"      TEXT;

-- Step 3: Tambah kolom purchasingId dengan DEFAULT sementara NULL dulu
-- lalu kita isi dengan PO dummy jika perlu, atau biarkan nullable dulu
-- PALING AMAN: buat nullable dulu, migrate data, baru buat required

ALTER TABLE "DeliveryOrderItem"
  ADD COLUMN "purchasingId" TEXT;

-- Step 4: Untuk baris lama (yang tidak punya purchasingId),
-- kita tidak bisa paksa FK ke PO yang tidak ada.
-- Solusi: hapus saja 6 baris lama karena mereka dari skema lama yang tidak valid.
-- (DO-nya juga dari skema lama tanpa supplier per item)

DELETE FROM "DeliveryOrderItem"
WHERE "purchasingId" IS NULL;

-- Step 5: Sekarang baru enforce NOT NULL dan FK
ALTER TABLE "DeliveryOrderItem"
  ALTER COLUMN "purchasingId" SET NOT NULL;

ALTER TABLE "DeliveryOrderItem"
  ADD CONSTRAINT "DeliveryOrderItem_purchasingId_fkey"
  FOREIGN KEY ("purchasingId")
  REFERENCES "Purchasing"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Tambah FK warehouseId (nullable)
ALTER TABLE "DeliveryOrderItem"
  ADD CONSTRAINT "DeliveryOrderItem_warehouseId_fkey"
  FOREIGN KEY ("warehouseId")
  REFERENCES "Warehouse"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Hapus relasi lama DeliveryOrder → Purchasing (purchasingOrders)
-- yang dulu via deliveryOrderId di tabel Purchasing
-- Cek dulu apakah kolom itu ada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Purchasing'
    AND column_name = 'deliveryOrderId'
  ) THEN
    ALTER TABLE "Purchasing" DROP CONSTRAINT IF EXISTS "Purchasing_deliveryOrderId_fkey";
    ALTER TABLE "Purchasing" DROP COLUMN IF EXISTS "deliveryOrderId";
  END IF;
END $$;

-- Step 8: Hapus field lama di DeliveryOrder yang tidak dipakai
ALTER TABLE "DeliveryOrder"
  DROP COLUMN IF EXISTS "supplier",
  DROP COLUMN IF EXISTS "linkedPOId",
  DROP COLUMN IF EXISTS "linkedPONo";

-- Step 9: Hapus baris DeliveryOrder lama yang sekarang tidak punya item
-- (karena item-nya sudah dihapus di Step 4)
DELETE FROM "DeliveryOrder"
WHERE id NOT IN (
  SELECT DISTINCT "deliveryOrderId" FROM "DeliveryOrderItem"
);

-- Step 10: Drop DEFAULT sementara supaya skema bersih
ALTER TABLE "DeliveryOrderItem" ALTER COLUMN "itemSnapshot"     DROP DEFAULT;
ALTER TABLE "DeliveryOrderItem" ALTER COLUMN "supplierSnapshot" DROP DEFAULT;
ALTER TABLE "DeliveryOrderItem" ALTER COLUMN "qtyDO"            DROP DEFAULT;

-- ============================================================
-- Verifikasi akhir
-- ============================================================
-- SELECT COUNT(*) FROM "DeliveryOrderItem";  -- harus 0 (semua lama dihapus)
-- SELECT COUNT(*) FROM "DeliveryOrder";       -- mungkin 0 juga