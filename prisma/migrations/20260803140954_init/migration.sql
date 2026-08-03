-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'support', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('active', 'canceled', 'past_due', 'incomplete');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "ToolSource" AS ENUM ('youtube', 'tiktok');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('youtube', 'stripe', 'google_oauth', 'redis', 'adsense', 'admin', 'email', 'analytics');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "googleId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "priceYearly" INTEGER NOT NULL,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "tagGenLimit" INTEGER NOT NULL,
    "keywordSearchLimit" INTEGER NOT NULL,
    "rankCheckLimit" INTEGER NOT NULL,
    "featuresJson" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL DEFAULT 'active',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'month',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_daily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tagGenCount" INTEGER NOT NULL DEFAULT 0,
    "keywordSearchCount" INTEGER NOT NULL DEFAULT 0,
    "rankCheckCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usage_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "source" "ToolSource" NOT NULL DEFAULT 'youtube',
    "tagsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "volume" INTEGER,
    "difficulty" INTEGER,
    "competition" DOUBLE PRECISION,
    "viabilityScore" DOUBLE PRECISION,
    "relatedJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_keywords" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "listId" TEXT,
    "metricsJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rank_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages_content" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,

    CONSTRAINT "pages_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metaJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "category" "SettingCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "page" TEXT,
    "message" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_daily_userId_date_key" ON "usage_daily"("userId", "date");

-- CreateIndex
CREATE INDEX "tag_generations_userId_idx" ON "tag_generations"("userId");

-- CreateIndex
CREATE INDEX "keyword_searches_userId_idx" ON "keyword_searches"("userId");

-- CreateIndex
CREATE INDEX "rank_checks_userId_idx" ON "rank_checks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pages_content_key_key" ON "pages_content"("key");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_daily" ADD CONSTRAINT "usage_daily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_generations" ADD CONSTRAINT "tag_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_searches" ADD CONSTRAINT "keyword_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_lists" ADD CONSTRAINT "keyword_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_keywords" ADD CONSTRAINT "saved_keywords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_keywords" ADD CONSTRAINT "saved_keywords_listId_fkey" FOREIGN KEY ("listId") REFERENCES "keyword_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rank_checks" ADD CONSTRAINT "rank_checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
