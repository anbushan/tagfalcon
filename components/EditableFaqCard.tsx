"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

type Faq = { id: string; question: string; answer: string; isActive: boolean };

export default function EditableFaqCard({ faq }: { faq: Faq }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/admin/faq/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
    setLoading(false);
    setEditing(false);
    if (!res.ok) {
      showToast("Couldn't save FAQ.", "error");
      return;
    }
    showToast("FAQ updated.");
    router.refresh();
  }

  async function toggleActive() {
    setLoading(true);
    const res = await fetch(`/api/admin/faq/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't update visibility.", "error");
      return;
    }
    showToast(faq.isActive ? "FAQ hidden." : "FAQ shown.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this FAQ entry?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/faq/${faq.id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't delete FAQ.", "error");
      return;
    }
    showToast("FAQ deleted.");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="rounded-md border p-3 text-sm">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-md border px-2 py-1"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border px-2 py-1"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={save}
            disabled={loading}
            className="rounded-md bg-gray-900 px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            Save
          </button>
          <button onClick={() => setEditing(false)} className="rounded-md border px-3 py-1 text-xs">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-md border p-3 text-sm ${!faq.isActive ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{faq.question}</p>
          <p className="mt-1 text-gray-600">{faq.answer}</p>
        </div>
        <div className="flex shrink-0 gap-1 text-xs">
          <button onClick={() => setEditing(true)} className="rounded-md border px-2 py-1 hover:bg-gray-50">
            Edit
          </button>
          <button onClick={toggleActive} disabled={loading} className="rounded-md border px-2 py-1 hover:bg-gray-50">
            {faq.isActive ? "Hide" : "Show"}
          </button>
          <button
            onClick={remove}
            disabled={loading}
            className="rounded-md border px-2 py-1 hover:bg-red-50 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
