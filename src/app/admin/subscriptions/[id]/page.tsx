import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-gray-100 text-gray-600",
  incomplete: "bg-red-100 text-red-700",
};

export default async function AdminSubscriptionDetailPage({ params }: { params: { id: string } }) {
  const sub = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: { plan: true, user: true },
  });
  if (!sub) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/admin/subscriptions" className="text-sm text-gray-500 hover:underline">
        ← Back to Subscriptions
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{sub.plan.name} — {sub.user.email}</h1>
          <p className="text-sm text-gray-500">Subscription {sub.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${statusColor[sub.status] ?? ""}`}>{sub.status}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Billing interval</p>
          <p className="mt-1 font-medium capitalize">{sub.billingInterval}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Started</p>
          <p className="mt-1 font-medium">{sub.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Renews</p>
          <p className="mt-1 font-medium">
            {sub.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Price</p>
          <p className="mt-1 font-medium">
            $
            {(
              (sub.billingInterval === "year" ? sub.plan.priceYearly / 12 : sub.plan.priceMonthly) / 100
            ).toFixed(0)}
            /mo
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Stripe</h2>
        <div className="mt-2 rounded-md border p-4 text-sm">
          <p>Customer ID: {sub.stripeCustomerId ?? "—"}</p>
          <p className="mt-1">Subscription ID: {sub.stripeSubscriptionId ?? "—"}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">User</h2>
        <div className="mt-2 rounded-md border p-4 text-sm">
          <Link href={`/admin/users/${sub.user.id}`} className="hover:underline">
            {sub.user.email}
          </Link>
          <p className="mt-1 text-gray-500">Role: {sub.user.role} · Status: {sub.user.status}</p>
        </div>
      </section>

      <p className="mt-8 text-xs text-gray-400">
        Refund/comp/cancel actions aren't wired up yet — manage this subscription directly in the
        Stripe dashboard for now.
      </p>
    </main>
  );
}
