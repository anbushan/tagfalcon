"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AddBlogPostForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!title.trim() || !bodyMd.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slugify(title),
        bodyMd,
        status: publishNow ? "published" : "draft",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error === "SLUG_TAKEN" ? "A post with that title already exists." : "Couldn't create post.", "error");
      return;
    }
    showToast("Post created.");
    setTitle("");
    setBodyMd("");
    setPublishNow(false);
    router.refresh();
  }

  return (
    <div className="rounded-md border border-dashed p-3 text-sm">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New post title"
        className="w-full rounded-md border px-2 py-1"
      />
      {title && <p className="mt-1 text-xs text-gray-400">/blog/{slugify(title)}</p>}
      <textarea
        value={bodyMd}
        onChange={(e) => setBodyMd(e.target.value)}
        placeholder="Post content..."
        rows={4}
        className="mt-2 w-full rounded-md border px-2 py-1"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
          Publish immediately
        </label>
        <button
          onClick={add}
          disabled={loading || !title.trim() || !bodyMd.trim()}
          className="rounded-md bg-gray-900 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Add post"}
        </button>
      </div>
    </div>
  );
}
