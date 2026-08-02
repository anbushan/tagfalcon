import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const status = searchParams.status?.trim();
  const { page, skip, take } = paginationParams(searchParams.page);

  const where = {
    ...(status ? { status: status as any } : {}),
    ...(q ? { user: { email: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const [subscriptions, totalCount] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { plan: true, user: true },
    }),
    prisma.subscription.count({ where }),
  ]);

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    past_due: "bg-amber-100 text-amber-700",
    canceled: "bg-gray-100 text-gray-600",
    incomplete: "bg-red-100 text-red-700",
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <p className="mt-1 text-sm text-gray-600">
        Synced from Stripe via webhooks — this table always reflects webhook-confirmed state, never
        client-side claims.
      </p>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/subscriptions">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by user email"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="incomplete">Incomplete</option>
        </select>
        <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto">
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">User</th>
            <th className="py-2">Plan</th>
            <th className="py-2">Interval</th>
            <th className="py-2">Status</th>
            <th className="py-2">Renews</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="border-b hover:bg-gray-50">
              <td className="py-2">
                <Link href={`/admin/subscriptions/${sub.id}`} className="hover:underline">
                  {sub.user.email}
                </Link>
              </td>
              <td className="py-2">{sub.plan.name}</td>
              <td className="py-2 capitalize">{sub.billingInterval}</td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[sub.status] ?? ""}`}>
                  {sub.status}
                </span>
              </td>
              <td className="py-2 text-gray-500">
                {sub.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
          {subscriptions.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-500">
                No subscriptions match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <Pagination
        basePath="/admin/subscriptions"
        currentPage={page}
        totalCount={totalCount}
        searchParams={{ q, status }}
      />
    </main>
  );
}
