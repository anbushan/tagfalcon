import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findActiveSubscription } from "@/lib/subscriptions";
import { BillingTitle, BillingPlanCard, BillingUsageGrid } from "@/components/BillingChrome";
import AdSlot from "@/components/AdSlot";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const [activeSub, freePlan] = await Promise.all([
    findActiveSubscription(userId),
    prisma.plan.findUnique({ where: { slug: "free" } }),
  ]);

  const plan = activeSub?.plan ?? freePlan;

  const today = new Date();
  const usage = await prisma.usageDaily.findUnique({
    where: {
      userId_date: {
        userId,
        date: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <BillingTitle />

      <BillingPlanCard
        planName={plan?.name ?? "Free"}
        hasActiveSub={!!activeSub}
        renewsAt={activeSub?.currentPeriodEnd ? activeSub.currentPeriodEnd.toLocaleDateString() : null}
      />

      <BillingUsageGrid
        metrics={[
          { key: "tagsToday", used: usage?.tagGenCount ?? 0, limit: plan?.tagGenLimit ?? "—" },
          { key: "keywordSearches", used: usage?.keywordSearchCount ?? 0, limit: plan?.keywordSearchLimit ?? "—" },
          { key: "rankChecks", used: usage?.rankCheckCount ?? 0, limit: plan?.rankCheckLimit ?? "—" },
          { key: "revenueReports", used: usage?.revenueReportCount ?? 0, limit: plan?.revenueReportLimit ?? "—" },
          { key: "trendsResearch", used: usage?.trendsResearchCount ?? 0, limit: plan?.trendsResearchLimit ?? "—" },
          { key: "videoOptimizations", used: usage?.videoOptimizationCount ?? 0, limit: plan?.videoOptimizationLimit ?? "—" },
          { key: "channelAudits", used: usage?.channelAuditCount ?? 0, limit: plan?.channelAuditLimit ?? "—" },
          { key: "hashtagGenerations", used: usage?.hashtagGenCount ?? 0, limit: plan?.hashtagGenLimit ?? "—" },
          { key: "uploadTimeChecks", used: usage?.uploadTimeCount ?? 0, limit: plan?.uploadTimeLimit ?? "—" },
          { key: "channelComparisons", used: usage?.channelComparisonCount ?? 0, limit: plan?.channelComparisonLimit ?? "—" },
          { key: "breakoutChecks", used: usage?.breakoutVideoCount ?? 0, limit: plan?.breakoutVideoLimit ?? "—" },
          { key: "topCreators", used: usage?.topCreatorsCount ?? 0, limit: plan?.topCreatorsLimit ?? "—" },
        ]}
      />

      <AdSlot slot="6666666666" />
    </main>
  );
}
