function toneFor(score: number): { ring: string; text: string } {
  if (score >= 80) return { ring: "#16a34a", text: "text-green-600 dark:text-green-400" };
  if (score >= 50) return { ring: "#d97706", text: "text-amber-600 dark:text-amber-400" };
  return { ring: "#FF0000", text: "text-yt-red" };
}

/** Circular 0-100 score ring, color-coded with the app's existing green/amber/red thresholds. */
export default function ScoreGauge({ score, size = 88 }: { score: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const { ring, text } = toneFor(clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-200 dark:text-yt-dark-3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className={`absolute text-xl font-bold ${text}`}>{Math.round(clamped)}</span>
    </div>
  );
}
