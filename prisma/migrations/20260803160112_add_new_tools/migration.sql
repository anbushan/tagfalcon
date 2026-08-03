-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "channelAuditLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "hashtagGenLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "trendsResearchLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "videoOptimizationLimit" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "usage_daily" ADD COLUMN     "channelAuditCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hashtagGenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trendsResearchCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoOptimizationCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "trend_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "resultsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trend_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_optimizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "videoTitle" TEXT NOT NULL,
    "videoThumbnail" TEXT,
    "score" INTEGER NOT NULL,
    "checklistJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "channelThumbnail" TEXT,
    "score" INTEGER NOT NULL,
    "metricsJson" JSONB NOT NULL DEFAULT '{}',
    "findingsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "hashtagsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtag_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trend_searches_userId_idx" ON "trend_searches"("userId");

-- CreateIndex
CREATE INDEX "video_optimizations_userId_idx" ON "video_optimizations"("userId");

-- CreateIndex
CREATE INDEX "channel_audits_userId_idx" ON "channel_audits"("userId");

-- CreateIndex
CREATE INDEX "hashtag_generations_userId_idx" ON "hashtag_generations"("userId");

-- AddForeignKey
ALTER TABLE "trend_searches" ADD CONSTRAINT "trend_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_optimizations" ADD CONSTRAINT "video_optimizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_audits" ADD CONSTRAINT "channel_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtag_generations" ADD CONSTRAINT "hashtag_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
