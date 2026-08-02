"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

type Props = { heroTitle: string; heroSubtitle: string };

export default function EditableLandingHero({ heroTitle, heroSubtitle }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState(heroTitle);
  const [subtitle, setSubtitle] = useState(heroSubtitle);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch("/api/admin/page-content/landing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentJson: { heroTitle: title, heroSubtitle: subtitle } }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't save landing page copy.", "error");
      return;
    }
    showToast("Landing page updated.");
    router.refresh();
  }

  return (
    <div className="rounded-md border p-4 text-sm">
      <p className="font-medium">Landing page hero</p>
      <p className="mt-1 text-xs text-gray-500">
        This is the headline and subheading shown at the top of the public landing page.
      </p>
      <label className="mt-3 block text-xs text-gray-500">Headline</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1 w-full rounded-md border px-2 py-1.5"
      />
      <label className="mt-3 block text-xs text-gray-500">Subheading</label>
      <textarea
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-md border px-2 py-1.5"
      />
      <button
        onClick={save}
        disabled={loading || (title === heroTitle && subtitle === heroSubtitle)}
        className="mt-3 rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
