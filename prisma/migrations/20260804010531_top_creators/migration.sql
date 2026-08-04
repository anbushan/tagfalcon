-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "topCreatorsLimit" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "usage_daily" ADD COLUMN     "topCreatorsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "top_creators_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "resultsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_creators_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "top_creators_searches_userId_idx" ON "top_creators_searches"("userId");

-- AddForeignKey
ALTER TABLE "top_creators_searches" ADD CONSTRAINT "top_creators_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
