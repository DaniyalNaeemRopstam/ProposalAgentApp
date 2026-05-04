import type { NextFunction, Request, Response } from "express";
import { Proposal } from "../models/Proposal";
import { User } from "../models/User";
import { fail } from "../utils/ApiResponse";
import { type BillingPlan, PLAN_CONFIGS } from "../utils/stripe";

/** Start of current calendar month in UTC. */
function monthStart(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Checks whether the authenticated user is within their plan's monthly proposal quota.
 * - free  → 5 proposals/month (Upwork only)
 * - paid  → unlimited
 *
 * Must run after `requireAuth`.
 * Returns HTTP 403 with an upgrade message when the limit is exceeded.
 */
export async function planGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await User.findById(req.user!._id, "plan").lean();
  if (!user) {
    res.status(401).json(fail("Account not found."));
    return;
  }

  const plan = (user.plan ?? "free") as BillingPlan;
  const config = PLAN_CONFIGS[plan];
  const limit = config.proposalsPerMonth;

  // Paid plans have no monthly cap
  if (limit === null) {
    // Attach plan for downstream use (e.g. aiRateLimiter)
    (req as Request & { userPlan?: string }).userPlan = plan;
    next();
    return;
  }

  // Count non-draft proposals created this month
  const used = await Proposal.countDocuments({
    userId: req.user!._id,
    status: { $nin: ["draft"] },
    createdAt: { $gte: monthStart() },
  });

  if (used >= limit) {
    const nextReset = new Date();
    nextReset.setUTCMonth(nextReset.getUTCMonth() + 1, 1);
    nextReset.setUTCHours(0, 0, 0, 0);

    res.status(403).json(
      fail(
        `You have used all ${limit} proposals included in the ${config.name} plan this month. ` +
          `Upgrade to Solo ($49/mo) for unlimited proposals across all platforms. ` +
          `Your quota resets on ${nextReset.toDateString()}.`,
        {
          plan,
          used,
          limit,
          nextReset: nextReset.toISOString(),
          upgradeUrl: "/dashboard?section=billing",
        }
      )
    );
    return;
  }

  (req as Request & { userPlan?: string }).userPlan = plan;
  next();
}
