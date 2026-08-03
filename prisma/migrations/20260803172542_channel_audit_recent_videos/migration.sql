-- AlterTable
ALTER TABLE "channel_audits" ADD COLUMN     "recentVideosJson" JSONB NOT NULL DEFAULT '[]';
