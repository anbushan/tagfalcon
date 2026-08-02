"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function AdSenseScript() {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config/adsense")
      .then((r) => r.json())
      .then((d) => setClientId(d.clientId))
      .catch(() => {});
  }, []);

  if (!clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
