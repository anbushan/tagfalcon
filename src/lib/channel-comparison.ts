import { fetchChannelAuditData } from "@/lib/channel-audit";

type ApiError = { apiError: string };
type NotFound = { notFound: true };

export type ComparisonSide = {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  subscriberCount: number | null;
  totalViewCount: number;
  videoCount: number;
  avgRecentViews: number;
  avgUploadGapDays: number | null;
  engagementRate: number;
  viewsTrend: "growing" | "declining" | "steady" | "unknown";
};

export type ComparisonData = { a: ComparisonSide; b: ComparisonSide };

export async function buildComparison(
  channelIdA: string,
  channelIdB: string,
  apiKey: string
): Promise<ComparisonData | ApiError | NotFound> {
  const [auditA, auditB] = await Promise.all([
    fetchChannelAuditData(channelIdA, apiKey),
    fetchChannelAuditData(channelIdB, apiKey),
  ]);

  if ("apiError" in auditA) return auditA;
  if ("notFound" in auditA) return auditA;
  if ("apiError" in auditB) return auditB;
  if ("notFound" in auditB) return auditB;

  const toSide = (audit: typeof auditA): ComparisonSide => ({
    channelId: audit.channelId,
    channelTitle: audit.channelTitle,
    channelThumbnail: audit.channelThumbnail,
    subscriberCount: audit.subscriberCount,
    totalViewCount: audit.totalViewCount,
    videoCount: audit.videoCount,
    avgRecentViews:
      audit.recentVideos.length > 0
        ? Math.round(audit.recentVideos.reduce((s, v) => s + v.views, 0) / audit.recentVideos.length)
        : 0,
    avgUploadGapDays: audit.avgUploadGapDays,
    engagementRate: audit.engagementRate,
    viewsTrend: audit.viewsTrend,
  });

  return { a: toSide(auditA), b: toSide(auditB) };
}
