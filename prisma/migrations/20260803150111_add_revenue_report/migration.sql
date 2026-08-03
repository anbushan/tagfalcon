-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "revenueReportLimit" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "usage_daily" ADD COLUMN     "revenueReportCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "revenue_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "channelThumbnail" TEXT,
    "category" TEXT,
    "subscriberCount" DOUBLE PRECISION,
    "totalViewCount" DOUBLE PRECISION,
    "videoCount" INTEGER,
    "avgViewsRecent" DOUBLE PRECISION,
    "estMonthlyViews" DOUBLE PRECISION,
    "estRevenueLowUsd" INTEGER,
    "estRevenueHighUsd" INTEGER,
    "recentVideosJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_reports_userId_idx" ON "revenue_reports"("userId");

-- AddForeignKey
ALTER TABLE "revenue_reports" ADD CONSTRAINT "revenue_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
