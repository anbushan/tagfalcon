import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingTitle, BillingPlanCard, BillingUsageGrid } from "@/components/BillingChrome";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const [activeSub, freePlan] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
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
        tagsToday={usage?.tagGenCount ?? 0}
        tagsLimit={plan?.tagGenLimit ?? "—"}
        keywordSearches={usage?.keywordSearchCount ?? 0}
        keywordLimit={plan?.keywordSearchLimit ?? "—"}
        rankChecks={usage?.rankCheckCount ?? 0}
        rankLimit={plan?.rankCheckLimit ?? "—"}
      />
    </main>
  );
}
