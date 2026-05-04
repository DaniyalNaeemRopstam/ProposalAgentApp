import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";
import { z } from "zod";
import { Proposal } from "../models/Proposal";
import { User } from "../models/User";
import { extractJsonPayload } from "../services/jobsAIService";
import { ok } from "../utils/ApiResponse";

// ─── Overview ────────────────────────────────────────────────────────────────

interface UserStats {
  proposalsSent?: number;
  repliesReceived?: number;
  projectsWon?: number;
  revenueWon?: number;
  winRate?: number;
  replyRate?: number;
}

/** GET /api/analytics/overview */
export async function overview(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!._id).lean();
  const s = (user?.stats ?? {}) as UserStats;

  const proposalsSent = s.proposalsSent ?? 0;
  const repliesReceived = s.repliesReceived ?? 0;
  const projectsWon = s.projectsWon ?? 0;
  const revenueWon = s.revenueWon ?? 0;

  const winRate =
    proposalsSent > 0 ? Math.round((projectsWon / proposalsSent) * 100 * 10) / 10 : 0;
  const replyRate =
    proposalsSent > 0 ? Math.round((repliesReceived / proposalsSent) * 100 * 10) / 10 : 0;

  res.json(
    ok({
      proposalsSent,
      repliesReceived,
      projectsWon,
      revenueWon,
      winRate,
      replyRate,
    })
  );
}

// ─── Monthly ─────────────────────────────────────────────────────────────────

/** GET /api/analytics/monthly
 *  Returns last 6 months of sent / replied / won counts.
 */
export async function monthly(req: Request, res: Response): Promise<void> {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  interface MonthGroup {
    _id: { year: number; month: number };
    sent: number;
    replied: number;
    won: number;
  }

  const rows = (await Proposal.aggregate([
    {
      $match: {
        userId: req.user!._id,
        createdAt: { $gte: since },
        status: { $nin: ["draft"] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        sent: { $sum: 1 },
        replied: {
          $sum: {
            $cond: [{ $in: ["$status", ["replied", "won"]] }, 1, 0],
          },
        },
        won: {
          $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ])) as MonthGroup[];

  const result = rows.map((r) => ({
    month: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
    sent: r.sent,
    replied: r.replied,
    won: r.won,
  }));

  res.json(ok(result));
}

// ─── Platforms ───────────────────────────────────────────────────────────────

/** GET /api/analytics/platforms
 *  Per-platform: count, replyRate, winRate.
 */
export async function platforms(req: Request, res: Response): Promise<void> {
  interface PlatformGroup {
    _id: string | null;
    count: number;
    replied: number;
    won: number;
  }

  const rows = (await Proposal.aggregate([
    {
      $match: {
        userId: req.user!._id,
        status: { $nin: ["draft"] },
      },
    },
    {
      $group: {
        _id: "$job.platform",
        count: { $sum: 1 },
        replied: {
          $sum: {
            $cond: [{ $in: ["$status", ["replied", "won"]] }, 1, 0],
          },
        },
        won: {
          $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ])) as PlatformGroup[];

  const result = rows.map((r) => ({
    platform: r._id ?? "unknown",
    count: r.count,
    replyRate: r.count > 0 ? Math.round((r.replied / r.count) * 100 * 10) / 10 : 0,
    winRate: r.count > 0 ? Math.round((r.won / r.count) * 100 * 10) / 10 : 0,
  }));

  res.json(ok(result));
}

// ─── Insights ────────────────────────────────────────────────────────────────

const insightSchema = z.array(
  z.object({
    type: z.enum(["positive", "warning", "suggestion"]),
    text: z.string(),
  })
);

async function callClaudeInsights(statsJson: string): Promise<z.infer<typeof insightSchema>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    return [
      {
        type: "warning",
        text: "AI insights are unavailable — ANTHROPIC_API_KEY is not configured.",
      },
    ];
  }

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Analyze this freelancer's proposal data and return exactly 6 actionable insights as a JSON array: [{ "type": "positive"|"warning"|"suggestion", "text": string }]. Be specific and data-driven. Reply with ONLY the JSON array, no prose. Data: ${statsJson}`,
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const parsed = extractJsonPayload(raw);
  const validated = insightSchema.safeParse(parsed);
  return validated.success ? validated.data : [];
}

/** GET /api/analytics/insights
 *  Calls Claude with 90-day aggregated data. Caches for 24 hours.
 */
export async function insights(req: Request, res: Response): Promise<void> {
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  const user = await User.findById(req.user!._id).lean();
  if (!user) {
    res.json(ok([]));
    return;
  }

  const cached = user.insightsCache as
    | { insights: unknown[]; cachedAt: Date }
    | null
    | undefined;

  if (cached?.cachedAt && Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS) {
    res.json(ok(cached.insights));
    return;
  }

  // Pull 90-day stats
  const since = new Date();
  since.setDate(since.getDate() - 90);

  interface MonthGroup {
    _id: { year: number; month: number };
    sent: number;
    replied: number;
    won: number;
  }

  const [recentRows, allStats] = await Promise.all([
    Proposal.aggregate([
      {
        $match: { userId: req.user!._id, createdAt: { $gte: since }, status: { $nin: ["draft"] } },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          sent: { $sum: 1 },
          replied: { $sum: { $cond: [{ $in: ["$status", ["replied", "won"]] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] } },
        },
      },
    ]) as Promise<MonthGroup[]>,
    User.findById(req.user!._id, "stats").lean(),
  ]);

  const statsPayload = {
    overallStats: (allStats?.stats ?? {}) as UserStats,
    last90Days: recentRows.map((r) => ({
      month: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
      sent: r.sent,
      replied: r.replied,
      won: r.won,
    })),
  };

  const insightsData = await callClaudeInsights(JSON.stringify(statsPayload));

  await User.updateOne(
    { _id: req.user!._id },
    { $set: { insightsCache: { insights: insightsData, cachedAt: new Date() } } }
  );

  res.json(ok(insightsData));
}

// ─── Best Time ───────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimeGroup {
  _id: { dayOfWeek: number; hour: number };
  sent: number;
  replied: number;
}

/** GET /api/analytics/best-time
 *  Returns best day-of-week + hour to submit proposals, based on reply rate.
 */
export async function bestTime(req: Request, res: Response): Promise<void> {
  const rows = (await Proposal.aggregate([
    {
      $match: {
        userId: req.user!._id,
        sentAt: { $exists: true, $ne: null },
        status: { $nin: ["draft"] },
      },
    },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: "$sentAt" }, // 1=Sun … 7=Sat (Mongo convention)
          hour: { $hour: "$sentAt" },
        },
        sent: { $sum: 1 },
        replied: {
          $sum: {
            $cond: [{ $in: ["$status", ["replied", "won"]] }, 1, 0],
          },
        },
      },
    },
    { $sort: { sent: -1 } },
  ])) as TimeGroup[];

  const enriched = rows
    .filter((r) => r.sent >= 2)
    .map((r) => ({
      day: DAYS[(r._id.dayOfWeek - 1) % 7],
      hour: r._id.hour,
      sent: r.sent,
      replied: r.replied,
      replyRate: Math.round((r.replied / r.sent) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.replyRate - a.replyRate);

  const best = enriched[0] ?? null;

  const recommendation = best
    ? {
        day: best.day,
        hour: best.hour,
        label: `${best.day}s around ${best.hour}:00 UTC`,
        replyRate: best.replyRate,
      }
    : null;

  res.json(ok({ recommendation, breakdown: enriched.slice(0, 14) }));
}
