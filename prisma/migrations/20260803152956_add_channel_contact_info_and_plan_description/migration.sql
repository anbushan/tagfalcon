-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "description" TEXT,
ADD COLUMN     "razorpayPlanIdMonthly" TEXT,
ADD COLUMN     "razorpayPlanIdYearly" TEXT;

-- AlterTable
ALTER TABLE "revenue_reports" ADD COLUMN     "channelCountry" TEXT,
ADD COLUMN     "channelCustomUrl" TEXT,
ADD COLUMN     "channelDescription" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "socialLinksJson" JSONB NOT NULL DEFAULT '[]';
