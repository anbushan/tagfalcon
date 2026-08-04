import { DollarSign, CreditCard, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import InsightLineChart from "@/components/charts/InsightLineChart";
import InsightBarChart from "@/components/charts/InsightBarChart";
import StatTile from "@/components/StatTile";

export default async function AdminOverviewPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeSubs, newSignups7d, totalUsers, plans, recentUsers] = await Promise.all([
    prisma.subscription.findMany({ where: { status: "active" }, include: { plan: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count(),
    prisma.plan.findMany({ where: { isActive: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
  ]);

  const mrrCents = activeSubs.reduce((sum, sub) => {
    const price = sub.billingInterval === "year" ? sub.plan.priceYearly / 12 : sub.plan.priceMonthly;
    return sum + price;
  }, 0);

  const cards = [
    { label: "MRR", value: `$${(mrrCents / 100).toFixed(0)}`, icon: DollarSign },
    { label: "Active subscriptions", value: activeSubs.length, icon: CreditCard },
    { label: "New signups (7d)", value: newSignups7d, icon: UserPlus },
    { label: "Total users", value: totalUsers, icon: Users },
  ];

  // Build a 7-day signup trend from raw createdAt timestamps
  const dayLabels: string[] = [];
  const dayCounts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    dayLabels.push(label);
    dayCounts[d.toDateString()] = 0;
  }
  recentUsers.forEach((u) => {
    const key = u.createdAt.toDateString();
    if (key in dayCounts) dayCounts[key]++;
  });
  const signupTrend = Object.entries(dayCounts).map(([dateStr, value], i) => ({
    name: dayLabels[i],
    value,
  }));

  // Plan distribution from active subscriptions
  const planCounts = new Map<string, number>();
  activeSubs.forEach((sub) => {
    planCounts.set(sub.plan.name, (planCounts.get(sub.plan.name) || 0) + 1);
  });
  const freeCount = Math.max(0, totalUsers - activeSubs.length);
  const planDistribution = [
    { name: "Free", value: freeCount },
    ...plans.filter((p) => p.slug !== "free").map((p) => ({ name: p.name, value: planCounts.get(p.name) || 0 })),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <StatTile key={card.label} icon={card.icon} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-yt border border-gray-200 p-4 dark:border-yt-border">
          <p className="text-sm font-medium">Signups — last 7 days</p>
          <InsightLineChart data={signupTrend} />
        </div>
        <div className="rounded-yt border border-gray-200 p-4 dark:border-yt-border">
          <p className="text-sm font-medium">Users by plan</p>
          <InsightBarChart
            data={planDistribution}
            colorByIndex={["#9CA3AF", "#FF0000", "#CC0000", "#7F1D1D"]}
          />
        </div>
      </div>

      {plans.length === 0 && (
        <p className="mt-6 text-sm text-amber-600">
          No plans found — run <code className="rounded bg-gray-100 px-1 dark:bg-yt-dark-3">npm run db:seed</code> to seed
          Free/Creator/Pro.
        </p>
      )}
    </main>
  );
}
