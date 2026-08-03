import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: { q?: string; active?: string };
}) {
  const q = searchParams.q?.trim();
  const active = searchParams.active?.trim();

  const plans = await prisma.plan.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(active ? { isActive: active === "true" } : {}),
    },
    orderBy: { priceMonthly: "asc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Plans</h1>
      <p className="mt-1 text-sm text-gray-600">
        Daily limits enforced by <code className="rounded bg-gray-100 px-1">src/lib/usage-limits.ts</code>{" "}
        on every tool call.
      </p>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/plans">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by plan name"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <select name="active" defaultValue={active ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
        <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <Link key={plan.id} href={`/admin/plans/${plan.id}`} className="block rounded-md border p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{plan.name}</h3>
              {!plan.isActive && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
              )}
            </div>
            <p className="mt-1 text-lg font-semibold">₹{(plan.priceMonthly / 100).toFixed(0)}/mo</p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              <li>{plan.tagGenLimit} tag generations/day</li>
              <li>{plan.keywordSearchLimit} keyword searches/day</li>
              <li>{plan.rankCheckLimit} rank checks/day</li>
            </ul>
          </Link>
        ))}
        {plans.length === 0 && (
          <p className="text-sm text-gray-500 sm:col-span-3">No plans match your filters.</p>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">Click a plan to edit its title, description, price, and limits.</p>
    </main>
  );
}
