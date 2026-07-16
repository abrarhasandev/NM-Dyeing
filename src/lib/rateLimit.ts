// @ts-nocheck
import { Redis } from "@upstash/redis";

const buckets = new Map();
const MAX_BUCKETS = 5000;
let pruneTimer = null;

function startPruning(intervalMs) {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
    // Hard cap eviction — prevent memory exhaustion from attacker spray
    if (buckets.size > MAX_BUCKETS) {
      const excess = buckets.size - MAX_BUCKETS;
      let evicted = 0;
      for (const key of buckets.keys()) {
        buckets.delete(key);
        if (++evicted >= excess) break;
      }
    }
  }, intervalMs);
  pruneTimer.unref?.();
}

let redis = null;
try {
  // Use Upstash Redis or Vercel KV if available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn("[RateLimit] Failed to initialize Redis:", error);
}

/**
 * Distributed rate limiter with progressive backoff.
 * Uses Redis if available, otherwise falls back to in-memory.
 *
 * @param {{ intervalMs: number; limit: number }} options
 */
export function rateLimit({ intervalMs, limit }) {
  if (!redis) startPruning(intervalMs);
  return {
    async check(key) {
      if (redis) {
        try {
          const currentCount = await redis.incr(key);
          if (currentCount === 1) {
            await redis.pexpire(key, intervalMs);
          }
          if (currentCount > limit) {
             const violations = Math.min(currentCount - limit, 3);
             const backoff = Math.min(intervalMs * (1 << violations), intervalMs * 4);
             await redis.pexpire(key, backoff);
             return { success: false, remaining: 0 };
          }
          return { success: true, remaining: Math.max(0, limit - currentCount) };
        } catch (error) {
           console.error("[RateLimit] Redis error:", error);
           // Fall through to memory fallback on error
        }
      }

      // Memory fallback
      const now = Date.now();
      let bucket = buckets.get(key);

      if (!bucket || now > bucket.resetAt) {
        // Evict oldest if at capacity
        if (buckets.size >= MAX_BUCKETS) {
          const oldest = buckets.keys().next().value;
          if (oldest !== undefined) buckets.delete(oldest);
        }
        bucket = { count: 1, resetAt: now + intervalMs, violations: 0 };
        buckets.set(key, bucket);
        return { success: true, remaining: limit - 1 };
      }

      bucket.count++;

      if (bucket.count > limit) {
        // Progressive backoff — extend lockout on repeated violations
        // Cap at 4× the original interval to avoid infinite lockout
        if (bucket.violations < 3) {
          bucket.violations++;
          const backoff = Math.min(intervalMs * (1 << bucket.violations), intervalMs * 4);
          bucket.resetAt = now + backoff;
        }
        return { success: false, remaining: 0 };
      }

      return { success: true, remaining: Math.max(0, limit - bucket.count) };
    },
  };
}

export function getClientIp(req) {
  const headers = req?.headers;
  if (!headers) return "unknown";
  const getHeader = (name) =>
    typeof headers.get === "function" ? headers.get(name) : headers[name];

  // Only trust the first (leftmost) value — closest to the real client
  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) return String(forwarded).split(",")[0].trim();
  const realIp = getHeader("x-real-ip");
  if (realIp) return String(realIp).trim();
  return "unknown";
}
