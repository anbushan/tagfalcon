/*
  Warnings:

  - You are about to drop the column `amountPaise` on the `subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "amountPaise",
ADD COLUMN     "amountMinorUnits" INTEGER,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR';
