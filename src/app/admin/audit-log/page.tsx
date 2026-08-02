import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: { q?: string; action?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const action = searchParams.action?.trim();
  const { page, skip, take } = paginationParams(searchParams.page);

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(q ? { admin: { email: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { admin: true },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-gray-600">
        Every admin action (plan change, ban, refund, impersonation) should write here — see the{" "}
        <code className="rounded bg-gray-100 px-1">AuditLog</code> model.
      </p>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/audit-log">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by admin email"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <input
          name="action"
          defaultValue={action}
          placeholder="Filter by action (e.g. ban_user)"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto">
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Admin</th>
            <th className="py-2">Action</th>
            <th className="py-2">Target</th>
            <th className="py-2">When</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b">
              <td className="py-2">{log.admin.email}</td>
              <td className="py-2">{log.action}</td>
              <td className="py-2 text-gray-500">
                {log.targetType}:{log.targetId}
              </td>
              <td className="py-2 text-gray-500">{log.createdAt.toLocaleString()}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-500">
                No admin actions logged yet — nothing currently writes to this table.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <Pagination
        basePath="/admin/audit-log"
        currentPage={page}
        totalCount={totalCount}
        searchParams={{ q, action }}
      />
    </main>
  );
}
