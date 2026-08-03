import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-gray-100 text-gray-600",
  incomplete: "bg-red-100 text-red-700",
};

export default async function AdminPaymentDetailPage({ params }: { params: { id: string } }) {
  const payment = await prisma.subscription.findUnique({
    where: { id: params.id },
    include: { plan: true, user: true },
  });
  if (!payment) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link href="/admin/payments" className="text-sm text-gray-500 hover:underline">
        ← Back to Payments
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{payment.plan.name} — {payment.user.email}</h1>
          <p className="text-sm text-gray-500">Payment {payment.id}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${statusColor[payment.status] ?? ""}`}>{payment.status}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Amount paid</p>
          <p className="mt-1 font-medium">
            {payment.amountPaise != null ? `₹${(payment.amountPaise / 100).toFixed(0)}` : "— (comped)"}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Billing interval</p>
          <p className="mt-1 font-medium capitalize">{payment.billingInterval}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Paid on</p>
          <p className="mt-1 font-medium">{payment.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-gray-500">Active until</p>
          <p className="mt-1 font-medium">
            {payment.currentPeriodEnd ? payment.currentPeriodEnd.toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">Razorpay</h2>
        <div className="mt-2 rounded-md border p-4 text-sm">
          <p>Order ID: {payment.razorpayOrderId ?? "— (comped)"}</p>
          <p className="mt-1">Payment ID: {payment.razorpayPaymentId ?? "—"}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">User</h2>
        <div className="mt-2 rounded-md border p-4 text-sm">
          <Link href={`/admin/users/${payment.user.id}`} className="hover:underline">
            {payment.user.email}
          </Link>
          <p className="mt-1 text-gray-500">Role: {payment.user.role} · Status: {payment.user.status}</p>
        </div>
      </section>

      <p className="mt-8 text-xs text-gray-400">
        Refund/comp actions aren't wired up yet — manage this payment directly in the Razorpay
        dashboard for now.
      </p>
    </main>
  );
}
