"use client";

import { useState } from "react";

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Circular channel avatar that falls back to the channel's first two
 * initials whenever the thumbnail URL 404s or otherwise fails to load —
 * YouTube channel thumbnail URLs do go stale/broken from time to time.
 */
export default function ChannelAvatar({
  src,
  name,
  size = 48,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-yt-red font-medium text-white ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </div>
  );
}
