"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

/**
 * Small "?" icon that reveals a plain-language explanation on click/tap —
 * click-toggle rather than hover-only so it works on touch devices, with an
 * outside-click listener to dismiss.
 */
export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="More info"
        className="inline-flex text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-gray-200 bg-white p-2 text-xs font-normal leading-snug text-gray-600 shadow-lg dark:border-yt-border dark:bg-yt-dark-3 dark:text-gray-300">
          {text}
        </span>
      )}
    </span>
  );
}
