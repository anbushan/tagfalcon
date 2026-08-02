"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function AdminNotificationForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [target, setTarget] = useState<"all" | "user">("user");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim() || (target === "user" && !email.trim())) return;
    if (target === "all" && !confirm("Send this notification to every user? This can't be undone.")) return;

    setLoading(true);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, target: target === "all" ? "all" : email.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      showToast(data.error === "USER_NOT_FOUND" ? "No user with that email." : "Couldn't send notification.", "error");
      return;
    }
    showToast(`Sent to ${data.recipientCount} user${data.recipientCount === 1 ? "" : "s"}.`);
    setTitle("");
    setBody("");
    setEmail("");
    router.refresh();
  }

  return (
    <div className="rounded-yt border border-gray-200 p-4 text-sm dark:border-yt-border">
      <div className="flex gap-2">
        <button
          onClick={() => setTarget("user")}
          className={`rounded-full px-3 py-1 text-xs ${target === "user" ? "bg-yt-red text-white" : "border border-gray-300 dark:border-yt-border"}`}
        >
          Specific user
        </button>
        <button
          onClick={() => setTarget("all")}
          className={`rounded-full px-3 py-1 text-xs ${target === "all" ? "bg-yt-red text-white" : "border border-gray-300 dark:border-yt-border"}`}
        >
          Broadcast to all
        </button>
      </div>

      {target === "user" && (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="mt-3 w-full rounded-md border border-gray-300 px-2 py-1.5 dark:border-yt-border dark:bg-yt-dark-2"
        />
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Notification title"
        className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 dark:border-yt-border dark:bg-yt-dark-2"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        rows={3}
        className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 dark:border-yt-border dark:bg-yt-dark-2"
      />
      <button
        onClick={send}
        disabled={loading || !title.trim() || !body.trim() || (target === "user" && !email.trim())}
        className="mt-2 rounded-full bg-yt-red px-4 py-1.5 text-xs font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
      >
        {loading ? "Sending..." : target === "all" ? "Broadcast" : "Send notification"}
      </button>
    </div>
  );
}
