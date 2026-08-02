"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Drop this into any regular-use app page. It only renders for users on the
 * Free plan (paid plans stay ad-free — the usual SaaS pattern), and only if
 * an AdSense client ID is configured (fetched at runtime from
 * /api/config/adsense, which reads the admin-configurable setting — not a
 * build-time env var, so changing it in /admin/config takes effect
 * immediately without a rebuild). Safe no-op otherwise so it never breaks
 * local dev without AdSense set up.
 */
export default function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const { data: session, status } = useSession();
  const [clientId, setClientId] = useState<string | null>(null);
  const planSlug = (session?.user as any)?.planSlug;

  useEffect(() => {
    fetch("/api/config/adsense")
      .then((r) => r.json())
      .then((d) => setClientId(d.clientId))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId || planSlug !== "free") return;
    try {
      // @ts-ignore — injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet or blocked — fine to ignore
    }
  }, [clientId, planSlug]);

  if (!clientId || status !== "authenticated" || planSlug !== "free") return null;

  return (
    <div className={`my-6 ${className}`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-gray-400">Advertisement</p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
