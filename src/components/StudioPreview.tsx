import { Play, MousePointerClick } from "lucide-react";

type Field = "title" | "description" | "tags";

const FIELD_CALLOUT: Record<Field, string> = {
  title: "Paste it in the Title field",
  description: "Paste it in the Description",
  tags: "Add these in the Tags field",
};

function FieldBox({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {active && (
        <span className="absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-yt-red px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
          <MousePointerClick size={10} />
          {label}
        </span>
      )}
      <div
        className={`rounded-lg border bg-white p-2.5 dark:bg-yt-dark-2 ${
          active ? "border-2 border-yt-red" : "border-gray-200 dark:border-yt-border"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Illustrative, hand-built mockup of YouTube Studio's video-details screen —
 * not a real screenshot — used to show a non-technical user *where* generated
 * tags/keywords/hashtags actually get used, since the tools themselves only
 * ever show a flat list of strings.
 */
export default function StudioPreview({
  highlight,
  sampleTitle,
  sampleDescription,
  sampleTags,
  note,
}: {
  highlight: Field[];
  sampleTitle?: string;
  sampleDescription?: string;
  sampleTags?: string[];
  note?: string;
}) {
  const is = (f: Field) => highlight.includes(f);

  return (
    <div className="rounded-yt border border-gray-200 bg-gray-50 p-4 dark:border-yt-border dark:bg-yt-panel">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        Where this goes — YouTube Studio video details (illustrative mockup)
      </p>

      <div className="mt-4 flex gap-3">
        <div className="w-28 shrink-0 sm:w-32">
          <div className="yt-thumb-wrap relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-red-500 to-orange-400">
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50">
                <Play size={13} fill="white" className="text-white" />
              </div>
            </div>
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-400">Thumbnail</p>
        </div>
        <div className="flex-1 space-y-3">
          <FieldBox active={is("title")} label={FIELD_CALLOUT.title}>
            <p className="text-xs text-gray-400">Title</p>
            <p className={`mt-0.5 truncate text-sm ${sampleTitle ? "" : "text-gray-300 dark:text-gray-600"}`}>
              {sampleTitle || "Enter title here"}
            </p>
          </FieldBox>
        </div>
      </div>

      <div className="mt-3">
        <FieldBox active={is("description")} label={FIELD_CALLOUT.description}>
          <p className="text-xs text-gray-400">Description</p>
          <p className={`mt-0.5 whitespace-pre-wrap text-sm ${sampleDescription ? "" : "text-gray-300 dark:text-gray-600"}`}>
            {sampleDescription || "Tell viewers about your video"}
          </p>
        </FieldBox>
      </div>

      <div className="mt-3">
        <FieldBox active={is("tags")} label={FIELD_CALLOUT.tags}>
          <p className="text-xs text-gray-400">Tags (under "Show more")</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {sampleTags && sampleTags.length > 0 ? (
              sampleTags.slice(0, 12).map((tag) => (
                <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-yt-dark-3">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-300 dark:text-gray-600">Add tags separated by commas</span>
            )}
          </div>
        </FieldBox>
      </div>

      {note && <p className="mt-3 text-xs text-gray-400">{note}</p>}
    </div>
  );
}
