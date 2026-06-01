import type { NextFunction, Request, Response } from "express";
import { Proposal } from "../models/Proposal";
import { User } from "../models/User";
import { type BillingPlan, FREE_PROPOSAL_LIFETIME_LIMIT, PLAN_CONFIGS } from "../utils/stripe";

/** Start of current calendar month in UTC. */
function monthStart(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Paid tiers that get unlimited AI proposal generation (billing rules still apply downstream). */
const PAID_PLANS = new Set<BillingPlan>(["solo", "pro", "enterprise"]);

/**
 * Enforces lifetime free-tier proposal-generation cap before POST /api/proposals/generate.
 * - Paid plans → pass (`proposalsRemaining` = null).
 * - Free plan → gates on persisted `totalProposalsGenerated`, bootstrapped from Proposal count once for legacy rows.
 *
 * Mutates Request: proposalsRemaining (free-only: slots left BEFORE this generation), proposalBillingPlan.
 */
export async function proposalGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  type LeanUser = {
    plan?: BillingPlan | string;
    stats?: { proposalsSent?: number };
    /** Present in Mongo only after first generation/sync; omit on legacy rows → bootstrap from Proposal count */
    totalProposalsGenerated?: number;
  };

  const userLean = (await User.findById(req.user!._id)
    .select("plan stats totalProposalsGenerated")
    .lean()) as LeanUser | null;

  if (!userLean) {
    res.status(401).json({ success: false, message: "Account not found." });
    return;
  }

  const plan = (userLean.plan ?? "free") as BillingPlan;
  req.proposalBillingPlan = plan;

  if (PAID_PLANS.has(plan)) {
    req.proposalsRemaining = null;
    (req as Request & { userPlan?: string }).userPlan = plan;
    next();
    return;
  }

  // ─── Free: prefer persisted counter; hydrate once from Proposal count when field missing in DB ───
  const limit = FREE_PROPOSAL_LIFETIME_LIMIT;

  let usedBefore =
    typeof userLean.totalProposalsGenerated === "number"
      ? userLean.totalProposalsGenerated
      : null;

  if (usedBefore == null) {
    const fromDb = await Proposal.countDocuments({
      userId: req.user!._id,
    });
    usedBefore = fromDb;
    await User.updateOne({ _id: req.user!._id }, { $set: { totalProposalsGenerated: fromDb } });
  }

  req.proposalsRemaining = Math.max(0, limit - usedBefore);

  if (usedBefore >= limit) {
    res.status(403).json({
      success: false,
      code: "PROPOSAL_LIMIT_REACHED",
      message: "You have used all 3 free proposals",
      proposalsUsed: usedBefore,
      proposalsLimit: limit,
      upgradeUrl: "/settings/billing",
    });
    return;
  }

  (req as Request & { userPlan?: string }).userPlan = plan;
  next();
}

/**
 * AI routes that aren't proposal generation — optional monthly quotas for hypothetical finite paid caps.
 * Free-tier proposal limits live in proposalGuard instead.
 *
 * Must run after `requireAuth`.
 */
export async function planGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await User.findById(req.user!._id, "plan").lean();
  if (!user) {
    res.status(401).json({ success: false, message: "Account not found." });
    return;
  }

  const plan = (user.plan ?? "free") as BillingPlan;
  const config = PLAN_CONFIGS[plan];
  const limit = config.proposalsPerMonth;

  if (plan === "free") {
    (req as Request & { userPlan?: string }).userPlan = plan;
    next();
    return;
  }

  if (limit === null) {
    (req as Request & { userPlan?: string }).userPlan = plan;
    next();
    return;
  }

  const usedMonth = await Proposal.countDocuments({
    userId: req.user!._id,
    status: { $nin: ["draft"] },
    createdAt: { $gte: monthStart() },
  });

  if (usedMonth >= limit) {
    const nextReset = new Date();
    nextReset.setUTCMonth(nextReset.getUTCMonth() + 1, 1);
    nextReset.setUTCHours(0, 0, 0, 0);

    res.status(403).json({
      success: false,
      message:
        `You have used all ${limit} proposals included in the ${config.name} plan this month. ` +
        `Upgrade to Solo ($49/mo) for unlimited proposals across all platforms. ` +
        `Your quota resets on ${nextReset.toDateString()}.`,
      errors: {
        plan,
        used: usedMonth,
        limit,
        nextReset: nextReset.toISOString(),
        upgradeUrl: "/dashboard?section=billing",
      },
    });
    return;
  }

  (req as Request & { userPlan?: string }).userPlan = plan;
  next();
}
