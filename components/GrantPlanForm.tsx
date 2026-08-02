"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function GrantPlanForm({
  userId,
  plans,
  currentPlanSlug,
}: {
  userId: string;
  plans: { slug: string; name: string }[];
  currentPlanSlug: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [planSlug, setPlanSlug] = useState(currentPlanSlug);
  const [loading, setLoading] = useState(false);

  async function grant() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug }),
    });
    if (!res.ok) {
      showToast("Couldn't grant plan.", "error");
      setLoading(false);
      return;
    }
    showToast(`Plan updated.`);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={planSlug}
        onChange={(e) => setPlanSlug(e.target.value)}
        className="rounded-md border px-2 py-1.5 text-sm"
      >
        {plans.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        onClick={grant}
        disabled={loading || planSlug === currentPlanSlug}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Granting..." : "Grant plan"}
      </button>
    </div>
  );
}
