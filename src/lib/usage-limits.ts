import { prisma } from "@/lib/prisma";
import { findActiveSubscription } from "@/lib/subscriptions";

type ToolKey =
  | "tagGenCount"
  | "keywordSearchCount"
  | "rankCheckCount"
  | "revenueReportCount"
  | "trendsResearchCount"
  | "videoOptimizationCount"
  | "channelAuditCount"
  | "hashtagGenCount"
  | "uploadTimeCount"
  | "channelComparisonCount"
  | "breakoutVideoCount"
  | "topCreatorsCount";
type LimitKey =
  | "tagGenLimit"
  | "keywordSearchLimit"
  | "rankCheckLimit"
  | "revenueReportLimit"
  | "trendsResearchLimit"
  | "videoOptimizationLimit"
  | "channelAuditLimit"
  | "hashtagGenLimit"
  | "uploadTimeLimit"
  | "channelComparisonLimit"
  | "breakoutVideoLimit"
  | "topCreatorsLimit";

const TOOL_TO_LIMIT: Record<ToolKey, LimitKey> = {
  tagGenCount: "tagGenLimit",
  keywordSearchCount: "keywordSearchLimit",
  rankCheckCount: "rankCheckLimit",
  revenueReportCount: "revenueReportLimit",
  trendsResearchCount: "trendsResearchLimit",
  videoOptimizationCount: "videoOptimizationLimit",
  channelAuditCount: "channelAuditLimit",
  hashtagGenCount: "hashtagGenLimit",
  uploadTimeCount: "uploadTimeLimit",
  channelComparisonCount: "channelComparisonLimit",
  breakoutVideoCount: "breakoutVideoLimit",
  topCreatorsCount: "topCreatorsLimit",
};

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Checks the user's current plan limit for a given tool, and increments usage
 * atomically if they're under the limit. Throws if the user has hit their
 * daily cap so callers can return a 402/429-style "upgrade" response.
 */
export async function checkAndIncrementUsage(userId: string, tool: ToolKey) {
  const date = todayUTC();

  const subscription = await findActiveSubscription(userId);

  const plan =
    subscription?.plan ??
    (await prisma.plan.findUnique({ where: { slug: "free" } }));

  if (!plan) throw new Error("No plan configured — did you run the seed script?");

  const limit = plan[TOOL_TO_LIMIT[tool]];

  const usage = await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  });

  if (usage[tool] >= limit) {
    const err: any = new Error("DAILY_LIMIT_REACHED");
    err.code = "DAILY_LIMIT_REACHED";
    err.limit = limit;
    err.plan = plan.name;
    throw err;
  }

  await prisma.usageDaily.update({
    where: { userId_date: { userId, date } },
    data: { [tool]: { increment: 1 } },
  });

  return { limit, used: usage[tool] + 1, plan: plan.name };
}
