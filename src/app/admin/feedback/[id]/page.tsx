import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminFeedbackDetailPage({ params }: { params: { id: string } }) {
  const feedback = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!feedback) notFound();

  const user = feedback.userId ? await prisma.user.findUnique({ where: { id: feedback.userId } }) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/admin/feedback" className="text-sm text-gray-500 hover:underline">
        ← Back to Feedback
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            feedback.emailSent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {feedback.emailSent ? "Emailed" : "Not emailed"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">From</p>
          <p className="mt-1 font-medium">{feedback.email || "Anonymous"}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Page</p>
          <p className="mt-1 font-medium">{feedback.page || "—"}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Submitted</p>
          <p className="mt-1 font-medium">{feedback.createdAt.toLocaleString()}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Message</h2>
        <p className="mt-2 whitespace-pre-wrap rounded-md border p-4 text-sm text-gray-700">
          {feedback.message}
        </p>
      </section>

      {user && (
        <section className="mt-8">
          <h2 className="font-medium">Submitted by</h2>
          <Link
            href={`/admin/users/${user.id}`}
            className="mt-2 block rounded-md border p-4 text-sm hover:bg-gray-50"
          >
            {user.email} — {user.role}, {user.status}
          </Link>
        </section>
      )}
    </main>
  );
}
