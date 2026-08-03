"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { SkeletonBar } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useLanguage } from "@/components/LanguageProvider";
import { trackEvent } from "@/lib/analytics";

type KeywordList = {
  id: string;
  name: string;
  createdAt: string;
  keywords: { id: string; keyword: string }[];
};

export default function KeywordWorkspacesPage() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [lists, setLists] = useState<KeywordList[]>([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadLists() {
    setLoading(true);
    const res = await fetch("/api/workspaces");
    const data = await res.json();
    setLists(data.lists || []);
    setLoading(false);
  }

  useEffect(() => {
    loadLists();
  }, []);

  async function createList() {
    if (name.trim().length < 1) return;
    setCreating(true);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (!res.ok) {
      showToast("Couldn't create workspace.", "error");
      return;
    }
    trackEvent("create_workspace", { name });
    showToast(`Workspace "${name}" created.`);
    setName("");
    loadLists();
  }

  const visibleLists = lists.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.keywords.some((k) => k.keyword.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("workspaces.title")}</h1>
      <p className="mt-1 text-sm text-gray-600">{t("workspaces.subtitle")}</p>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          placeholder={t("workspaces.newPlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={createList}
          disabled={creating || name.trim().length < 1}
          className="rounded-full bg-yt-red px-5 py-2 font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
        >
          {creating ? t("workspaces.creating") : t("workspaces.create")}
        </button>
      </div>

      {lists.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("workspaces.searchPlaceholder")}
          className="mt-4 w-72 rounded-md border px-3 py-2 text-sm"
        />
      )}

      <div className="mt-6 space-y-4">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <SkeletonBar key={i} className="h-16 w-full" />)}
        {!loading && lists.length === 0 && (
          <p className="text-sm text-gray-500">{t("workspaces.empty")}</p>
        )}
        {!loading && lists.length > 0 && visibleLists.length === 0 && (
          <p className="text-sm text-gray-500">No workspaces match your search.</p>
        )}
        {visibleLists.map((list) => (
          <Link key={list.id} href={`/app/research/keywords/workspaces/${list.id}`} className="block rounded-md border p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{list.name}</h3>
              <span className="text-xs text-gray-500">{list.keywords.length} keywords</span>
            </div>
            {list.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {list.keywords.map((k) => (
                  <span key={k.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {k.keyword}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      <AdSlot slot="4444444444" />
    </main>
  );
}
