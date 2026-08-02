"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

type BlogPost = { id: string; title: string; slug: string; bodyMd: string; status: string };

export default function EditableBlogPostCard({ post }: { post: BlogPost }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [bodyMd, setBodyMd] = useState(post.bodyMd);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, bodyMd }),
    });
    setLoading(false);
    setEditing(false);
    if (!res.ok) {
      showToast("Couldn't save post.", "error");
      return;
    }
    showToast("Post updated.");
    router.refresh();
  }

  async function togglePublish() {
    setLoading(true);
    const nextStatus = post.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't update post status.", "error");
      return;
    }
    showToast(nextStatus === "published" ? "Post published." : "Post moved to draft.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this blog post?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't delete post.", "error");
      return;
    }
    showToast("Post deleted.");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="rounded-md border p-3 text-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border px-2 py-1"
        />
        <textarea
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-md border px-2 py-1 font-mono text-xs"
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
    <div className="flex items-center justify-between rounded-md border p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{post.title}</p>
        <p className="truncate text-xs text-gray-400">/blog/{post.slug}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            post.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {post.status}
        </span>
        <button onClick={() => setEditing(true)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
          Edit
        </button>
        <button onClick={togglePublish} disabled={loading} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
          {post.status === "published" ? "Unpublish" : "Publish"}
        </button>
        <button
          onClick={remove}
          disabled={loading}
          className="rounded-md border px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
