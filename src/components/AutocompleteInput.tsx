"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import ChannelAvatar from "@/components/ChannelAvatar";

export type AutocompleteItem = {
  id: string;
  label: string;
  sublabel?: string;
  thumbnail?: string;
  value: string;
};

const DEBOUNCE_MS = 500;

/**
 * Text input with live suggestions (channel names, video titles, or keyword
 * autocomplete) plus a clear button — the shared input used across every
 * tool page. Selecting a suggestion hands its resolved `value` to `onPick`
 * (the page's existing analyze/generate/research(override) handler) rather
 * than relying on state having updated in time, mirroring how the existing
 * suggestion chips already work everywhere.
 */
export default function AutocompleteInput({
  value,
  onChange,
  onPick,
  onEnter,
  type,
  placeholder,
  disabled,
  minChars,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (value: string) => void;
  onEnter?: () => void;
  type: "channel" | "video" | "keyword";
  placeholder?: string;
  disabled?: boolean;
  minChars?: number;
  className?: string;
}) {
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const threshold = minChars ?? (type === "keyword" ? 2 : 3);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < threshold) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const res = await fetch("/api/tools/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, q }),
        });
        if (requestId !== requestIdRef.current) return; // stale response, a newer keystroke superseded it
        const data = await res.json();
        const newItems: AutocompleteItem[] = res.ok ? data.items || [] : [];
        setItems(newItems);
        setOpen(newItems.length > 0);
        setHighlighted(-1);
      } catch {
        if (requestId === requestIdRef.current) setItems([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function pick(item: AutocompleteItem) {
    setOpen(false);
    setItems([]);
    onPick(item.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && items.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => (h + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => (h <= 0 ? items.length - 1 : h - 1));
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Enter" && highlighted >= 0) {
        e.preventDefault();
        pick(items[highlighted]);
        return;
      }
    }
    if (e.key === "Enter") {
      setOpen(false);
      onEnter?.();
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        className={
          className ??
          "w-full rounded-full border border-gray-300 px-4 py-2 pr-9 focus:border-yt-red focus:outline-none dark:border-yt-border dark:bg-yt-dark-2"
        }
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => items.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 size={15} className="animate-spin text-gray-400" />
        ) : value ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              onChange("");
              setItems([]);
              setOpen(false);
            }}
            aria-label="Clear"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-yt-border dark:bg-yt-dark-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(item)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                i === highlighted ? "bg-gray-100 dark:bg-yt-dark-3" : "hover:bg-gray-50 dark:hover:bg-yt-dark-3"
              }`}
            >
              {type === "channel" ? (
                <ChannelAvatar src={item.thumbnail} name={item.label} size={28} />
              ) : (
                item.thumbnail && (
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-yt-dark-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                  </div>
                )
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.label}</p>
                {item.sublabel && <p className="truncate text-xs text-gray-400">{item.sublabel}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
