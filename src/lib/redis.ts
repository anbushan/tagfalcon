import { Redis } from "@upstash/redis";
import { getSetting } from "@/lib/settings";

let client: Redis | null | undefined; // undefined = not checked yet, null = not configured

async function getRedisClient(): Promise<Redis | null> {
  if (client !== undefined) return client;

  const url = await getSetting("UPSTASH_REDIS_REST_URL");
  const token = await getSetting("UPSTASH_REDIS_REST_TOKEN");

  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

/**
 * Cache-aside helper for YouTube API responses.
 * Falls back to calling `fn` directly if Redis isn't configured (e.g. local dev).
 */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const redis = await getRedisClient();
  if (!redis) return fn();

  const existing = await redis.get<T>(key);
  if (existing !== null && existing !== undefined) return existing;

  const fresh = await fn();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
