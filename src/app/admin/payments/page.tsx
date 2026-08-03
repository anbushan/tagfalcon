import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";

const SORT_COLUMNS = ["createdAt", "amountPaise", "status"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

function isSortColumn(value: string | undefined): value is SortColumn {
  return !!value && (SORT_COLUMNS as readonly string[]).includes(value);
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; sort?: string; dir?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const status = searchParams.status?.trim();
  const sort: SortColumn = isSortColumn(searchParams.sort) ? searchParams.sort : "createdAt";
  const dir: "asc" | "desc" = searchParams.dir === "asc" ? "asc" : "desc";
  const { page, skip, take } = paginationParams(searchParams.page);

  const where = {
    ...(status ? { status: status as any } : {}),
    ...(q ? { user: { email: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const [payments, totalCount] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { [sort]: dir },
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

  function sortHref(column: SortColumn) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("sort", column);
    params.set("dir", sort === column && dir === "desc" ? "asc" : "desc");
    return `/admin/payments?${params.toString()}`;
  }

  function SortHeader({ column, label }: { column: SortColumn; label: string }) {
    const active = sort === column;
    return (
      <th className="py-2">
        <Link href={sortHref(column)} className="inline-flex items-center gap-1 hover:text-gray-900">
          {label}
          {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
        </Link>
      </th>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="mt-1 text-sm text-gray-600">
        One-time Razorpay purchases, confirmed via webhook — this table always reflects
        webhook-confirmed state, never client-side claims. Click a column header to sort.
      </p>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/payments">
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
            <SortHeader column="amountPaise" label="Amount" />
            <SortHeader column="status" label="Status" />
            <SortHeader column="createdAt" label="Paid on" />
            <th className="py-2">Active until</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="py-2">
                <Link href={`/admin/payments/${p.id}`} className="hover:underline">
                  {p.user.email}
                </Link>
              </td>
              <td className="py-2">{p.plan.name}</td>
              <td className="py-2">{p.amountPaise != null ? `₹${(p.amountPaise / 100).toFixed(0)}` : "— (comped)"}</td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[p.status] ?? ""}`}>
                  {p.status}
                </span>
              </td>
              <td className="py-2 text-gray-500">{p.createdAt.toLocaleDateString()}</td>
              <td className="py-2 text-gray-500">
                {p.currentPeriodEnd ? p.currentPeriodEnd.toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-gray-500">
                No payments match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <Pagination
        basePath="/admin/payments"
        currentPage={page}
        totalCount={totalCount}
        searchParams={{ q, status, sort, dir }}
      />
    </main>
  );
}
