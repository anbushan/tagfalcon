import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; status?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const role = searchParams.role?.trim();
  const status = searchParams.status?.trim();
  const { page, skip, take } = paginationParams(searchParams.page);

  const where = {
    ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}),
    ...(role ? { role: role as any } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        subscriptions: { where: { status: "active" }, include: { plan: true }, take: 1 },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Users</h1>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/users">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <select name="role" defaultValue={role ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto">
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Email</th>
            <th className="py-2">Plan</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
            <th className="py-2">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b hover:bg-gray-50">
              <td className="py-2">
                <Link href={`/admin/users/${u.id}`} className="hover:underline">
                  {u.email}
                </Link>
              </td>
              <td className="py-2">{u.subscriptions[0]?.plan.name ?? "Free"}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td className="py-2 text-gray-500">{u.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-500">
                No users match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <Pagination
        basePath="/admin/users"
        currentPage={page}
        totalCount={totalCount}
        searchParams={{ q, role, status }}
      />
    </main>
  );
}
