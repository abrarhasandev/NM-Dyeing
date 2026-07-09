const buckets = new Map();
const MAX_BUCKETS = 10000;
let pruneTimer = null;

function startPruning(intervalMs) {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
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

export function rateLimit({ intervalMs, limit }) {
  startPruning(intervalMs);
  return {
    check(key) {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket || now > bucket.resetAt) {
        if (buckets.size >= MAX_BUCKETS) {
          const oldest = buckets.keys().next().value;
          if (oldest !== undefined) buckets.delete(oldest);
        }
        bucket = { count: 1, resetAt: now + intervalMs };
        buckets.set(key, bucket);
        return { success: true, remaining: limit - 1 };
      }
      bucket.count++;
      return { success: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
    },
  };
}

export function getClientIp(req) {
  const headers = req?.headers;
  if (!headers) return "unknown";
  const getHeader = (name) =>
    typeof headers.get === "function" ? headers.get(name) : headers[name];
  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) return String(forwarded).split(",")[0].trim();
  const realIp = getHeader("x-real-ip");
  if (realIp) return String(realIp);
  return "unknown";
}
