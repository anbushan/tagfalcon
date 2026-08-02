"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function SendNotificationForm({ userId }: { userId: string }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't send notification.", "error");
      return;
    }
    showToast("Notification sent.");
    setTitle("");
    setBody("");
  }

  return (
    <div className="rounded-yt border border-gray-200 p-4 text-sm dark:border-yt-border">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Notification title"
        className="w-full rounded-md border border-gray-300 px-2 py-1.5 dark:border-yt-border dark:bg-yt-dark-2"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        rows={2}
        className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 dark:border-yt-border dark:bg-yt-dark-2"
      />
      <button
        onClick={send}
        disabled={loading || !title.trim() || !body.trim()}
        className="mt-2 rounded-full bg-yt-red px-3 py-1.5 text-xs font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send notification"}
      </button>
    </div>
  );
}
