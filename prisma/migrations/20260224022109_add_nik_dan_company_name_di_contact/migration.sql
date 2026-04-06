/*
  Warnings:

  - You are about to drop the column `amount` on the `Purchasing` table. All the data in the column will be lost.
  - The `qty` column on the `Purchasing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[nik]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "nik" TEXT;

-- AlterTable
ALTER TABLE "Purchasing" DROP COLUMN "amount",
ADD COLUMN     "price" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'KG',
DROP COLUMN "qty",
ADD COLUMN     "qty" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "trxNo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "createdBy" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_trxNo_key" ON "Transaction"("trxNo");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_nik_key" ON "Contact"("nik");
