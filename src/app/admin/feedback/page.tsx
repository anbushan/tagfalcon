import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Pagination, { paginationParams } from "@/components/Pagination";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q?.trim();
  const { page, skip, take } = paginationParams(searchParams.page);

  const where = q
    ? {
        OR: [
          { message: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { page: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [feedback, totalCount] = await Promise.all([
    prisma.feedback.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.feedback.count({ where }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Feedback</h1>
      <p className="mt-1 text-sm text-gray-600">
        Submissions from the feedback widget. Emailed to the configured recipient when SMTP is
        set up, and always saved here regardless.
      </p>

      <form className="mt-6" action="/admin/feedback">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search message, email, or page..."
          className="w-80 rounded-md border px-3 py-2 text-sm"
        />
      </form>

      <div className="mt-6 divide-y rounded-md border">
        {feedback.map((f) => (
          <Link
            key={f.id}
            href={`/admin/feedback/${f.id}`}
            className="block px-4 py-3 text-sm hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="line-clamp-1 flex-1">{f.message}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  f.emailSent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {f.emailSent ? "Emailed" : "Not emailed"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span>{f.email || "anonymous"}</span>
              {f.page && <span>· {f.page}</span>}
              <span>· {f.createdAt.toLocaleString()}</span>
            </div>
          </Link>
        ))}
        {feedback.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            {q ? "No feedback matches your search." : "No feedback submitted yet."}
          </p>
        )}
      </div>

      <Pagination basePath="/admin/feedback" currentPage={page} totalCount={totalCount} searchParams={{ q }} />
    </main>
  );
}
