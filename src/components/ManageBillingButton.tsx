"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function ManageBillingButton() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.url;
      } else {
        showToast("Couldn't open billing portal.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Opening..." : "Manage billing"}
    </button>
  );
}
