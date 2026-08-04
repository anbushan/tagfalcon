"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { trackEvent } from "@/lib/analytics";
import { convertInrPaiseToCurrency, formatCurrency } from "@/lib/currency";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  tagGenLimit: number;
  keywordSearchLimit: number;
  rankCheckLimit: number;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState("INR");

  useEffect(() => {
    fetch("/api/config/geo")
      .then((res) => res.json())
      .then((data) => {
        if (data.currency) setDisplayCurrency(data.currency);
      })
      .catch(() => {});
  }, []);

  function displayPrice(inrPaise: number) {
    const amount = displayCurrency === "INR" ? inrPaise : convertInrPaiseToCurrency(inrPaise, displayCurrency);
    return formatCurrency(amount, displayCurrency);
  }

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
          data.error === "RAZORPAY_NOT_CONFIGURED"
            ? "Payments aren't configured yet — set the Razorpay keys in Configuration."
            : data.error === "RAZORPAY_API_ERROR"
            ? `Couldn't start checkout: ${data.detail || "unknown error"}.`
            : "Couldn't start checkout. Try again.";
        setError(message);
        showToast(message, "error");
        setLoadingSlug(null);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        const message = "Couldn't load the payment widget. Check your connection and try again.";
        setError(message);
        showToast(message, "error");
        setLoadingSlug(null);
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "TagFalcon",
        description: `${data.planName} — ${interval === "year" ? "yearly" : "monthly"}`,
        prefill: { email: session.user?.email || undefined },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/billing/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            window.location.href = "/app/billing?checkout=success";
          } else {
            showToast("Payment received but activation failed — contact support.", "error");
          }
        },
        modal: {
          ondismiss: () => setLoadingSlug(null),
        },
      });
      razorpay.open();
    } catch {
      setError("Couldn't start checkout. Try again.");
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
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">
                {displayPrice(price)}
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">/mo</span>
              </p>
              {interval === "year" && plan.priceMonthly > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">billed {displayPrice(plan.priceYearly)}/yr</p>
              )}
              {plan.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
              )}
              <ul className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>{plan.tagGenLimit} tag generations/day</li>
                <li>{plan.keywordSearchLimit} keyword searches/day</li>
                <li>{plan.rankCheckLimit} rank checks/day</li>
              </ul>
              <button
                onClick={() => choosePlan(plan)}
                disabled={loadingSlug === plan.slug}
                className="mt-6 w-full rounded-full bg-yt-red py-2 font-medium text-white hover:bg-yt-red-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSlug === plan.slug ? "Redirecting..." : isFree ? `Choose ${plan.name}` : `Get ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
