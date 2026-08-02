"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function RemoveKeywordButton({ keywordId }: { keywordId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    const res = await fetch(`/api/saved-keywords/${keywordId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't remove keyword.", "error");
      return;
    }
    showToast("Keyword removed.");
    router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
    >
      Remove
    </button>
  );
}
