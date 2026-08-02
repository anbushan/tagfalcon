"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { trackEvent } from "@/lib/analytics";

export default function FeedbackButton() {
  const pathname = usePathname();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  async function submit() {
    if (message.trim().length < 3) return;
    setLoading(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, page: pathname }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't send feedback. Try again.", "error");
      return;
    }
    trackEvent("submit_feedback", { page: pathname });
    showToast("Thanks — feedback sent!");
    setMessage("");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg hover:bg-gray-700 dark:bg-yt-dark-3 dark:hover:bg-yt-dark-2 sm:bottom-6 sm:right-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
          <div className="w-full max-w-sm rounded-t-lg bg-white p-5 sm:rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Share feedback</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Found a bug, or have an idea? Tell us — it goes straight to the team.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What's on your mind?"
              className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
            />
            <button
              onClick={submit}
              disabled={loading || message.trim().length < 3}
              className="mt-3 w-full rounded-md bg-gray-900 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
