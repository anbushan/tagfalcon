"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

const LIMIT_FIELDS = [
  { key: "tagGenLimit", label: "Tag generations" },
  { key: "keywordSearchLimit", label: "Keyword searches" },
  { key: "rankCheckLimit", label: "Rank checks" },
  { key: "revenueReportLimit", label: "Revenue reports" },
  { key: "trendsResearchLimit", label: "Trends research" },
  { key: "videoOptimizationLimit", label: "Video optimizations" },
  { key: "channelAuditLimit", label: "Channel audits" },
  { key: "hashtagGenLimit", label: "Hashtag generations" },
  { key: "uploadTimeLimit", label: "Best upload time checks" },
  { key: "channelComparisonLimit", label: "Channel comparisons" },
  { key: "breakoutVideoLimit", label: "Breakout video checks" },
] as const;

type LimitKey = (typeof LIMIT_FIELDS)[number]["key"];

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
} & Record<LimitKey, number>;

export default function EditablePlanForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [priceMonthly, setPriceMonthly] = useState(String(plan.priceMonthly / 100));
  const [priceYearly, setPriceYearly] = useState(String(plan.priceYearly / 100));
  const [limits, setLimits] = useState<Record<LimitKey, string>>(
    Object.fromEntries(LIMIT_FIELDS.map((f) => [f.key, String(plan[f.key])])) as Record<LimitKey, string>
  );
  const [isActive, setIsActive] = useState(plan.isActive);

  function resetToPlan() {
    setName(plan.name);
    setDescription(plan.description ?? "");
    setPriceMonthly(String(plan.priceMonthly / 100));
    setPriceYearly(String(plan.priceYearly / 100));
    setLimits(Object.fromEntries(LIMIT_FIELDS.map((f) => [f.key, String(plan[f.key])])) as Record<LimitKey, string>);
    setIsActive(plan.isActive);
  }

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        priceMonthly: Math.round(Number(priceMonthly) * 100),
        priceYearly: Math.round(Number(priceYearly) * 100),
        ...Object.fromEntries(LIMIT_FIELDS.map((f) => [f.key, Number(limits[f.key])])),
        isActive,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      showToast("Couldn't save plan.", "error");
      return;
    }
    setEditing(false);
    showToast("Plan updated.");
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-6">
        <p className="text-sm text-gray-600">{plan.description || "No description set yet."}</p>

        <section className="mt-6">
          <h2 className="font-medium">Daily limits</h2>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {LIMIT_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} value={String(plan[f.key])} center />
            ))}
          </div>
        </section>

        <button
          onClick={() => setEditing(true)}
          className="mt-8 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Edit plan
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 rounded-md border p-5">
      <div>
        <label className="text-xs font-medium text-gray-500">Title</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Shown on the pricing page — what makes this plan worth choosing."
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Monthly price (₹)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Yearly price (₹)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={priceYearly}
            onChange={(e) => setPriceYearly(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium">Daily limits</h3>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {LIMIT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-500">{f.label}</label>
              <input
                type="number"
                min={0}
                value={limits[f.key]}
                onChange={(e) => setLimits((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active (visible for new subscriptions)
      </label>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          onClick={() => {
            resetToPlan();
            setEditing(false);
          }}
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, center }: { label: string; value: string; center?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${center ? "text-center" : ""}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
