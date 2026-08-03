"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { trackEvent } from "@/lib/analytics";
import { useLanguage } from "@/components/LanguageProvider";
import Avatar from "@/components/Avatar";
import AdSlot from "@/components/AdSlot";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(session?.user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveName() {
    if (!name.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSavingName(false);
    if (!res.ok) {
      showToast("Couldn't update name.", "error");
      return;
    }
    trackEvent("update_profile_name");
    showToast("Name updated.");
    await update();
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (!res.ok) {
      showToast("Couldn't delete account.", "error");
      setDeleting(false);
      return;
    }
    trackEvent("delete_account");
    await signOut({ callbackUrl: "/" });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">{t("profile.title")}</h1>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.photo")}</h2>
        <div className="mt-3 flex items-center gap-4">
          <Avatar email={session?.user?.email} name={session?.user?.name} size={56} />
          <p className="text-xs text-gray-400">
            Your avatar is generated from your email — there's no photo to upload or manage.
          </p>
        </div>
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.name")}</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
          />
          <button
            onClick={saveName}
            disabled={savingName || !name.trim() || name.trim() === session?.user?.name}
            className="rounded-full bg-yt-red px-4 py-2 text-sm font-medium text-white hover:bg-yt-red-dark disabled:opacity-50"
          >
            {savingName ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.email")}</h2>
        <p className="mt-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-yt-border dark:bg-yt-dark-2">
          {session?.user?.email}
        </p>
        <p className="mt-1 text-xs text-gray-400">{t("profile.emailNote")}</p>
      </section>

      <section className="mt-12 max-w-2xl rounded-yt border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-sm font-medium text-red-700 dark:text-red-400">{t("profile.deleteAccount")}</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("profile.deleteWarning")}</p>
        <div className="mt-3 flex gap-2">
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={t("profile.deleteConfirmPlaceholder")}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm dark:border-yt-border dark:bg-yt-dark-2"
          />
          <button
            onClick={deleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? t("profile.deleting") : t("profile.deleteAccount")}
          </button>
        </div>
      </section>

      <AdSlot slot="1313131313" />
    </main>
  );
}
