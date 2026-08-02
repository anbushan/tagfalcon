"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type Setting = {
  key: string;
  label: string;
  category: string;
  isSecret: boolean;
  description?: string;
  hasValue: boolean;
  preview: string | null;
  source: "database" | "env" | "none";
  updatedAt: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  youtube: "YouTube Data API",
  stripe: "Stripe",
  google_oauth: "Google OAuth",
  redis: "Upstash Redis",
  adsense: "Google AdSense",
  admin: "Admin",
  email: "Email (SMTP)",
  analytics: "Analytics",
};

function SourceBadge({ source }: { source: Setting["source"] }) {
  if (source === "none") return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        source === "database" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-gray-100 text-gray-500 dark:bg-yt-dark-3"
      }`}
    >
      {source === "database" ? "DB override" : "from .env"}
    </span>
  );
}

function SettingRow({ setting, onSaved }: { setting: Setting; onSaved: () => void }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!value.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: setting.key, value }),
    });
    setLoading(false);
    if (res.ok) {
      setEditing(false);
      setValue("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      showToast(`${setting.label} updated.`);
      onSaved();
    } else {
      showToast(`Couldn't update ${setting.label}.`, "error");
    }
  }

  async function clearOverride() {
    if (!confirm(`Clear the database override for ${setting.label} and fall back to .env?`)) return;
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: setting.key }),
    });
    setLoading(false);
    if (res.ok) {
      showToast(`Cleared override for ${setting.label}.`);
      onSaved();
    } else {
      showToast("Couldn't clear override.", "error");
    }
  }

  return (
    <div className="border-b py-3 last:border-b-0 dark:border-yt-border">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{setting.label}</p>
            <SourceBadge source={setting.source} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{setting.key}</p>
          {setting.description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-yt-dark-3 dark:text-gray-300">
                {setting.hasValue ? setting.preview : "not set"}
              </span>
              {saved && <span className="text-xs text-green-600">Saved</span>}
              {setting.source === "database" && (
                <button
                  onClick={clearOverride}
                  disabled={loading}
                  title="Remove the DB override so this falls back to .env"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-yt-border dark:hover:bg-yt-dark-3"
                >
                  Clear override
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-yt-border dark:hover:bg-yt-dark-3"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
      {editing && (
        <div className="mt-2 flex gap-2">
          <input
            type={setting.isSecret ? "password" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`New ${setting.label.toLowerCase()}`}
            className="flex-1 rounded-md border px-2 py-1.5 text-sm dark:border-yt-border dark:bg-yt-dark-2"
          />
          <button
            onClick={save}
            disabled={loading || !value.trim()}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-yt-red"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setValue("");
            }}
            className="rounded-md border px-3 py-1.5 text-xs dark:border-yt-border"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminConfigPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setSettings(data.settings || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold">Configuration</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Every third-party key the app depends on, in one place. A "DB override" badge means the
        value here takes precedence over <code className="rounded bg-gray-100 px-1 dark:bg-yt-dark-3">.env</code> —
        common trap: if you seeded the database before adding a real key to{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-yt-dark-3">.env</code>, an empty DB
        row can quietly shadow a correct .env value. Use "Clear override" to fall back to .env.
      </p>
      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        Security note: values are stored as plain text in Postgres, not encrypted. For a real
        production deployment, consider a secrets manager (Vercel/AWS/etc.) instead of — or in
        addition to — this table, and restrict database access accordingly.
      </p>

      {loading && <p className="mt-6 text-sm text-gray-500">Loading...</p>}

      {!loading &&
        Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="mt-8">
            <h2 className="font-medium">{CATEGORY_LABELS[category] ?? category}</h2>
            <div className="mt-2 rounded-md border px-4 dark:border-yt-border">
              {items.map((s) => (
                <SettingRow key={s.key} setting={s} onSaved={load} />
              ))}
            </div>
          </section>
        ))}
    </main>
  );
}
