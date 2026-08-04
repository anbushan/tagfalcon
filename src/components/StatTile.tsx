import type { LucideIcon } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

const TONE_CLASSES: Record<"good" | "warn" | "bad" | "neutral", string> = {
  good: "text-green-600 dark:text-green-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-yt-red",
  neutral: "text-gray-900 dark:text-gray-100",
};

const TONE_ICON_BG: Record<"good" | "warn" | "bad" | "neutral", string> = {
  good: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  bad: "bg-red-100 text-yt-red dark:bg-red-900/30",
  neutral: "bg-gray-100 text-gray-600 dark:bg-yt-dark-3 dark:text-gray-400",
};

/** Icon + big number + label stat display, using the app's existing green/amber/red convention. */
export default function StatTile({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  tooltip,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "good" | "warn" | "bad" | "neutral";
  tooltip?: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 p-3 dark:border-yt-border">
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE_ICON_BG[tone]}`}>
          <Icon size={15} />
        </span>
        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </p>
      </div>
      <p className={`mt-1.5 text-xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</p>
    </div>
  );
}
