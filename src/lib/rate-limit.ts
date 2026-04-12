/**
 * Lean in-memory rate limiter. Fine for single-instance deployments.
 * For multi-region / serverless, swap for Upstash Redis or a Vercel KV-backed
 * implementation — the function signature stays the same.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Token-bucket-ish limiter: `limit` requests per `windowMs` per key.
 * Keys are typically "<route>:<ip>".
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/** Periodically purge expired buckets to keep the map bounded. */
function sweep() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Single timer per process; safe against module re-evaluation in dev.
const timer: NodeJS.Timeout | undefined = (
  globalThis as unknown as { __rlTimer?: NodeJS.Timeout }
).__rlTimer;
if (!timer) {
  const t = setInterval(sweep, 60_000);
  if (typeof t.unref === "function") t.unref();
  (globalThis as unknown as { __rlTimer?: NodeJS.Timeout }).__rlTimer = t;
}
