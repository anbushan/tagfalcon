import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BanUserButton from "@/components/BanUserButton";
import GrantPlanForm from "@/components/GrantPlanForm";
import SendNotificationForm from "@/components/SendNotificationForm";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();

  const [tagGens, keywordSearches, rankChecks, todayUsage, allPlans] = await Promise.all([
    prisma.tagGeneration.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.keywordSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.rankCheck.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.usageDaily.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  const activeSub = user.subscriptions.find((s) => s.status === "active");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/admin/users" className="text-sm text-gray-500 hover:underline">
        ← Back to Users
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {user.status}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{user.role}</span>
          <BanUserButton userId={user.id} status={user.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Plan</p>
          <p className="mt-1 font-medium">{activeSub?.plan.name ?? "Free"}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Joined</p>
          <p className="mt-1 font-medium">{user.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Tags today</p>
          <p className="mt-1 font-medium">{todayUsage?.tagGenCount ?? 0}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Keyword searches today</p>
          <p className="mt-1 font-medium">{todayUsage?.keywordSearchCount ?? 0}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Grant plan</h2>
        <p className="mt-1 text-xs text-gray-500">
          Manually comps a plan without going through Stripe. Cancels any existing active
          subscription first.
        </p>
        <div className="mt-2">
          <GrantPlanForm
            userId={user.id}
            plans={allPlans}
            currentPlanSlug={activeSub?.plan.slug ?? "free"}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Send notification</h2>
        <p className="mt-1 text-xs text-gray-500">
          Appears in this user's notification bell immediately.
        </p>
        <div className="mt-2">
          <SendNotificationForm userId={user.id} />
        </div>
      </section>

      {activeSub && (
        <section className="mt-8">
          <h2 className="font-medium">Subscription</h2>
          <div className="mt-2 rounded-md border p-4 text-sm">
            <p>Stripe customer: {activeSub.stripeCustomerId ?? "—"}</p>
            <p className="mt-1">Interval: {activeSub.billingInterval}</p>
            <p className="mt-1">
              Renews: {activeSub.currentPeriodEnd ? activeSub.currentPeriodEnd.toLocaleDateString() : "—"}
            </p>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-medium">Recent tag generations</h2>
        <div className="mt-2 divide-y rounded-md border text-sm">
          {tagGens.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-2">
              <span>{t.query}</span>
              <span className="text-xs text-gray-400">{t.createdAt.toLocaleDateString()}</span>
            </div>
          ))}
          {tagGens.length === 0 && <p className="px-4 py-3 text-gray-500">None yet.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Recent keyword searches</h2>
        <div className="mt-2 divide-y rounded-md border text-sm">
          {keywordSearches.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-2">
              <span>{k.keyword}</span>
              <span className="text-xs text-gray-400">{k.createdAt.toLocaleDateString()}</span>
            </div>
          ))}
          {keywordSearches.length === 0 && <p className="px-4 py-3 text-gray-500">None yet.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Recent rank checks</h2>
        <div className="mt-2 divide-y rounded-md border text-sm">
          {rankChecks.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-2">
              <span>
                {r.keyword} — {r.videoId}
              </span>
              <span className="text-xs text-gray-400">{r.position ? `#${r.position}` : "not found"}</span>
            </div>
          ))}
          {rankChecks.length === 0 && <p className="px-4 py-3 text-gray-500">None yet.</p>}
        </div>
      </section>

      <p className="mt-8 text-xs text-gray-400">
        Impersonation and manual reset of daily usage limits aren't wired up yet.
      </p>
    </main>
  );
}
