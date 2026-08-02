"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function BanUserButton({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const nextStatus = status === "active" ? "suspended" : "active";
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(
        data.error === "CANNOT_SUSPEND_SUPER_ADMIN" ? "Can't suspend a super admin." : "Action failed.",
        "error"
      );
      setLoading(false);
      return;
    }
    showToast(nextStatus === "suspended" ? "User suspended." : "User reactivated.");
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 ${
        status === "active" ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-green-50 hover:text-green-600"
      }`}
    >
      {loading ? "Working..." : status === "active" ? "Suspend user" : "Reactivate user"}
    </button>
  );
}
