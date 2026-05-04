import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/ApiResponse";

const FREE_HOURLY_LIMIT = 20;
const PAID_HOURLY_LIMIT = Infinity;
const WINDOW_MS = 60 * 60 * 1_000; // 1 hour

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

const PAID_PLANS = new Set(["solo", "pro", "enterprise"]);

function prune(now: number): void {
  for (const [key, b] of buckets) {
    if (now - b.windowStart > WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

function getLimit(plan?: string): number {
  return plan && PAID_PLANS.has(plan) ? PAID_HOURLY_LIMIT : FREE_HOURLY_LIMIT;
}

/**
 * Plan-aware AI rate limiter:
 *   free          → 20 AI requests / hour per user
 *   solo/pro/enterprise → unlimited
 *
 * Requires `requireAuth` to run first. Falls back to IP when no user.
 */
export function aiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  prune(now);

  const userId = req.user?._id?.toString();
  const key = userId ?? req.ip ?? "anonymous";

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    buckets.set(key, bucket);
  }

  const limit = getLimit((req as Request & { userPlan?: string }).userPlan);

  if (bucket.count >= limit) {
    const windowEndSecs = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1_000);
    res
      .status(429)
      .setHeader("Retry-After", String(windowEndSecs))
      .json(
        fail(
          `AI request limit reached (${FREE_HOURLY_LIMIT}/hour on the free plan). ` +
            `Upgrade your plan for unlimited access, or retry in ${Math.ceil(windowEndSecs / 60)} minute(s).`
        )
      );
    return;
  }

  bucket.count += 1;
  next();
}

