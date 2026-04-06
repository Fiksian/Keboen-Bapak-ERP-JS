/*
  Warnings:

  - Added the required column `test` to the `STTB` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "STTB" ADD COLUMN     "test" TEXT NOT NULL;
