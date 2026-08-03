-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "amountPaise" INTEGER;

-- AlterTable
ALTER TABLE "video_optimizations" ADD COLUMN     "detailsJson" JSONB NOT NULL DEFAULT '{}';
