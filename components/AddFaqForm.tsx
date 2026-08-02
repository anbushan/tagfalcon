"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function AddFaqForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!question.trim() || !answer.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't add FAQ.", "error");
      return;
    }
    showToast("FAQ added.");
    setQuestion("");
    setAnswer("");
    router.refresh();
  }

  return (
    <div className="rounded-md border border-dashed p-3 text-sm">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="New question"
        className="w-full rounded-md border px-2 py-1"
      />
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer"
        rows={2}
        className="mt-2 w-full rounded-md border px-2 py-1"
      />
      <button
        onClick={add}
        disabled={loading || !question.trim() || !answer.trim()}
        className="mt-2 rounded-md bg-gray-900 px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add FAQ"}
      </button>
    </div>
  );
}
