import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import {
  runAggregation,
  getLastAggregationStats,
} from "../workers/jobAggregator";
import { Job } from "../models/Job";
import { AppSettings } from "../models/AppSettings";

export const integrationsRouter = Router();

integrationsRouter.use(requireAuth);

const rapidApiBodySchema = z.object({
  rapidApiKey: z.string().min(10, "Key looks too short"),
});

/**
 * PUT /api/integrations/rapidapi-key
 * Persist RapidAPI key when env is not set (singleton settings doc).
 */
integrationsRouter.put(
  "/rapidapi-key",
  asyncHandler(async (req, res) => {
    const parsed = rapidApiBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    await AppSettings.findOneAndUpdate(
      {},
      { $set: { rapidApiKey: parsed.data.rapidApiKey.trim() } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true });
  })
);

/**
 * POST /api/integrations/sync
 * Manually trigger job aggregation across all platforms
 */
integrationsRouter.post(
  "/sync",
  asyncHandler(async (_req, res) => {
    const stats = await runAggregation();

    return res.status(200).json({
      success: true,
      message: "Job aggregation completed",
      stats: {
        lastRun: stats.lastRun,
        jobsFetched: stats.jobsFetched,
        newJobsAdded: stats.newJobsAdded,
        hotJobsFound: stats.hotJobsFound,
        errors: stats.errors,
      },
    });
  })
);

/**
 * GET /api/integrations/status
 * Get aggregation status and platform statistics
 */
integrationsRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    const lastStats = getLastAggregationStats();
    const userId = req.user?._id;

    // Get job counts per platform for this user
    const platformCounts = await Job.aggregate([
      { $match: { userId, isAggregated: true } },
      {
        $group: {
          _id: "$platform",
          count: { $sum: 1 },
          avgScore: { $avg: "$score" },
          lastFetched: { $max: "$fetchedAt" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get total aggregated jobs for user
    const totalAggregated = await Job.countDocuments({
      userId,
      isAggregated: true,
    });

    // Get recent high-score jobs (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentHighScoreJobs = await Job.countDocuments({
      userId,
      isAggregated: true,
      fetchedAt: { $gte: oneDayAgo },
      score: { $gte: 85 },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const jobsFetchedTodayByPlatform = await Job.aggregate([
      {
        $match: {
          userId,
          isAggregated: true,
          fetchedAt: { $gte: startOfDay },
        },
      },
      { $group: { _id: "$platform", count: { $sum: 1 } } },
    ]);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const jobsAddedThisWeek = await Job.countDocuments({
      userId,
      archived: false,
      createdAt: { $gte: weekAgo },
    });

    const totalJobsInDatabase = await Job.countDocuments({
      userId,
      archived: false,
    });

    const avgAggScore = await Job.aggregate([
      { $match: { userId, isAggregated: true, archived: false } },
      { $group: { _id: null, avg: { $avg: "$score" } } },
    ]);
    const averageScoreOfAggregated =
      avgAggScore[0]?.avg != null ? Math.round(Number(avgAggScore[0].avg)) : null;

    const mostActivePlatform = platformCounts[0]?._id ?? null;

    const todayMap = Object.fromEntries(
      jobsFetchedTodayByPlatform.map((r) => [String(r._id), r.count])
    ) as Record<string, number>;

    return res.status(200).json({
      aggregation: {
        lastRun: lastStats?.lastRun || null,
        nextRun: lastStats
          ? new Date(lastStats.lastRun.getTime() + 15 * 60 * 1000)
          : null,
        status: lastStats ? "active" : "pending",
        lastStats: lastStats || null,
      },
      platforms: platformCounts.map((p) => ({
        platform: p._id,
        totalJobs: p.count,
        averageScore: Math.round(p.avgScore),
        lastFetched: p.lastFetched,
        jobsFetchedToday: todayMap[String(p._id)] ?? 0,
      })),
      summary: {
        totalAggregatedJobs: totalAggregated,
        recentHighScoreJobs,
        connectedPlatforms: [
          "LinkedIn",
          "Wellfound",
          "HackerNews",
          "Upwork",
        ],
        totalJobsInDatabase,
        jobsAddedThisWeek,
        mostActivePlatform,
        averageScoreOfAggregated,
        jobsFetchedTodayByPlatform: todayMap,
      },
    });
  })
);

/**
 * GET /api/integrations/platforms
 * Get list of available platforms and their status
 */
integrationsRouter.get(
  "/platforms",
  asyncHandler(async (_req, res) => {
    const envKey = Boolean(process.env.RAPIDAPI_KEY?.trim());
    const doc = await AppSettings.findOne().select("rapidApiKey").lean();
    const dbKey = Boolean(doc?.rapidApiKey?.trim());
    const linkedinEnabled = envKey || dbKey;

    const platforms = [
      {
        id: "linkedin",
        name: "LinkedIn",
        enabled: linkedinEnabled,
        type: "api",
        description: "LinkedIn Jobs via RapidAPI",
      },
      {
        id: "wellfound",
        name: "Wellfound",
        enabled: true,
        type: "rss",
        description: "Wellfound (formerly AngelList) startup jobs",
      },
      {
        id: "hackernews",
        name: "HackerNews",
        enabled: true,
        type: "scraping",
        description: "HN 'Who is Hiring' monthly thread",
      },
      {
        id: "upwork",
        name: "Upwork",
        enabled: true,
        type: "rss",
        description: "Upwork RSS job feeds",
      },
    ];

    return res.status(200).json({
      platforms,
      totalEnabled: platforms.filter((p) => p.enabled).length,
    });
  })
);
