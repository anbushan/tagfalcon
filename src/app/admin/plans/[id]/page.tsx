import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminPlanDetailPage({ params }: { params: { id: string } }) {
  const plan = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!plan) notFound();

  const [activeCount, subscribers] = await Promise.all([
    prisma.subscription.count({ where: { planId: plan.id, status: "active" } }),
    prisma.subscription.findMany({
      where: { planId: plan.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/admin/plans" className="text-sm text-gray-500 hover:underline">
        ← Back to Plans
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{plan.name}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            plan.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {plan.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Monthly price</p>
          <p className="mt-1 font-medium">${(plan.priceMonthly / 100).toFixed(0)}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Yearly price</p>
          <p className="mt-1 font-medium">${(plan.priceYearly / 100).toFixed(0)}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Active subscribers</p>
          <p className="mt-1 font-medium">{activeCount}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Slug</p>
          <p className="mt-1 font-medium">{plan.slug}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Daily limits</h2>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-gray-500">Tag generations</p>
            <p className="mt-1 text-lg font-semibold">{plan.tagGenLimit}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-gray-500">Keyword searches</p>
            <p className="mt-1 text-lg font-semibold">{plan.keywordSearchLimit}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-gray-500">Rank checks</p>
            <p className="mt-1 text-lg font-semibold">{plan.rankCheckLimit}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Stripe price IDs</h2>
        <div className="mt-2 rounded-md border p-4 text-sm">
          <p>Monthly: {plan.stripePriceIdMonthly ?? "not configured"}</p>
          <p className="mt-1">Yearly: {plan.stripePriceIdYearly ?? "not configured"}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Recent subscribers</h2>
        <div className="mt-2 divide-y rounded-md border text-sm">
          {subscribers.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2">
              <Link href={`/admin/users/${s.user.id}`} className="hover:underline">
                {s.user.email}
              </Link>
              <span className="text-xs text-gray-400">{s.status}</span>
            </div>
          ))}
          {subscribers.length === 0 && <p className="px-4 py-3 text-gray-500">No subscribers yet.</p>}
        </div>
      </section>

      <p className="mt-8 text-xs text-gray-400">
        Editing limits/prices here isn't wired up yet — change via{" "}
        <code className="rounded bg-gray-100 px-1">prisma/seed.ts</code> or Prisma Studio.
      </p>
    </main>
  );
}
