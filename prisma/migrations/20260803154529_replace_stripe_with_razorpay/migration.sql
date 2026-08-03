-- AlterEnum
BEGIN;
CREATE TYPE "SettingCategory_new" AS ENUM ('youtube', 'razorpay', 'google_oauth', 'redis', 'adsense', 'admin', 'email', 'analytics');
ALTER TABLE "system_settings" ALTER COLUMN "category" TYPE "SettingCategory_new" USING ("category"::text::"SettingCategory_new");
ALTER TYPE "SettingCategory" RENAME TO "SettingCategory_old";
ALTER TYPE "SettingCategory_new" RENAME TO "SettingCategory";
DROP TYPE "SettingCategory_old";
COMMIT;

-- DropIndex
DROP INDEX "subscriptions_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "razorpayPlanIdMonthly",
DROP COLUMN "razorpayPlanIdYearly",
DROP COLUMN "stripePriceIdMonthly",
DROP COLUMN "stripePriceIdYearly";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_razorpayOrderId_key" ON "subscriptions"("razorpayOrderId");

