import { prisma } from "@/lib/prisma";
import AdminNotificationForm from "@/components/AdminNotificationForm";
import Pagination, { paginationParams } from "@/components/Pagination";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { page, skip, take } = paginationParams(searchParams.page);

  const where = { action: { in: ["send_notification", "broadcast_notification"] } };
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
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Send a notification to one user or broadcast to everyone — it appears in their
        notification bell immediately.
      </p>

      <div className="mt-6 max-w-xl">
        <AdminNotificationForm />
      </div>

      <section className="mt-10">
        <h2 className="font-medium">Recently sent</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500 dark:border-yt-border dark:text-gray-400">
                <th className="py-2">Sent by</th>
                <th className="py-2">Type</th>
                <th className="py-2">Title</th>
                <th className="py-2">Target</th>
                <th className="py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const meta = log.metaJson as any;
                return (
                  <tr key={log.id} className="border-b dark:border-yt-border">
                    <td className="py-2">{log.admin.email}</td>
                    <td className="py-2">{log.action === "broadcast_notification" ? "Broadcast" : "Direct"}</td>
                    <td className="py-2">{meta?.title || "—"}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {log.action === "broadcast_notification"
                        ? `${meta?.recipientCount ?? "?"} users`
                        : meta?.email || log.targetId}
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">{log.createdAt.toLocaleString()}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No notifications sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/admin/notifications" currentPage={page} totalCount={totalCount} searchParams={{}} />
      </section>
    </main>
  );
}
