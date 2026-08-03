-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "breakoutVideoLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "channelComparisonLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "uploadTimeLimit" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "usage_daily" ADD COLUMN     "breakoutVideoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "channelComparisonCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uploadTimeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "best_upload_times" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "channelThumbnail" TEXT,
    "bestDay" TEXT,
    "bestHourUtc" INTEGER,
    "breakdownJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "best_upload_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelAId" TEXT NOT NULL,
    "channelATitle" TEXT NOT NULL,
    "channelBId" TEXT NOT NULL,
    "channelBTitle" TEXT NOT NULL,
    "comparisonJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakout_videos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "channelThumbnail" TEXT,
    "avgViews" DOUBLE PRECISION,
    "breakoutsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breakout_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "best_upload_times_userId_idx" ON "best_upload_times"("userId");

-- CreateIndex
CREATE INDEX "channel_comparisons_userId_idx" ON "channel_comparisons"("userId");

-- CreateIndex
CREATE INDEX "breakout_videos_userId_idx" ON "breakout_videos"("userId");

-- AddForeignKey
ALTER TABLE "best_upload_times" ADD CONSTRAINT "best_upload_times_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_comparisons" ADD CONSTRAINT "channel_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakout_videos" ADD CONSTRAINT "breakout_videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
