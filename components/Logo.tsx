export default function Logo({ size = "text-lg", markSize = 24 }: { size?: string; markSize?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={markSize} height={markSize} className="shrink-0" />
      <span className={`font-bold ${size}`}>
        <span className="text-orange-500">Tag</span>
        <span className="text-gray-900 dark:text-white">Falcon</span>
      </span>
    </span>
  );
}
