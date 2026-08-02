"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { trackEvent } from "@/lib/analytics";

type Plan = {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  tagGenLimit: number;
  keywordSearchLimit: number;
  rankCheckLimit: number;
};

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choosePlan(plan: Plan) {
    setError(null);

    if (plan.slug === "free") {
      if (!session) {
        signIn("google", { callbackUrl: "/app/generator" });
      } else {
        window.location.href = "/app/generator";
      }
      return;
    }

    if (!session) {
      signIn("google", { callbackUrl: "/pricing" });
      return;
    }

    setLoadingSlug(plan.slug);
    trackEvent("begin_checkout", { plan: plan.slug, interval });
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          data.error === "STRIPE_PRICE_NOT_CONFIGURED"
            ? "This plan isn't connected to a Stripe price yet — set the price IDs in Configuration and re-seed."
            : "Couldn't start checkout. Try again.";
        setError(message);
        showToast(message, "error");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <div>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full border border-gray-300 p-1 text-sm dark:border-yt-border">
          <button
            onClick={() => setInterval("month")}
            className={`rounded-full px-4 py-1.5 ${interval === "month" ? "bg-yt-red text-white" : "text-gray-600 dark:text-gray-400"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`rounded-full px-4 py-1.5 ${interval === "year" ? "bg-yt-red text-white" : "text-gray-600 dark:text-gray-400"}`}
          >
            Yearly <span className="text-xs opacity-70">(2 months free)</span>
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const price = interval === "year" ? plan.priceYearly / 12 : plan.priceMonthly;
          const isFree = plan.slug === "free";
          return (
            <div key={plan.id} className="rounded-yt border border-gray-200 p-6 dark:border-yt-border">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {!isFree && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:bg-yt-dark-3 dark:text-gray-400">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold">
                ${(price / 100).toFixed(0)}
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">/mo</span>
              </p>
              {interval === "year" && plan.priceMonthly > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">billed ${(plan.priceYearly / 100).toFixed(0)}/yr</p>
              )}
              <ul className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>{plan.tagGenLimit} tag generations/day</li>
                <li>{plan.keywordSearchLimit} keyword searches/day</li>
                <li>{plan.rankCheckLimit} rank checks/day</li>
              </ul>
              <button
                onClick={() => isFree && choosePlan(plan)}
                disabled={!isFree || loadingSlug === plan.slug}
                title={!isFree ? "Paid plans are coming soon" : undefined}
                className="mt-6 w-full rounded-full bg-yt-red py-2 font-medium text-white hover:bg-yt-red-dark disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-yt-dark-3 dark:disabled:text-gray-500"
              >
                {!isFree ? "Coming soon" : loadingSlug === plan.slug ? "Redirecting..." : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
