import cron from "node-cron";
import { Job } from "../models/Job";
import { User } from "../models/User";
import { fetchLinkedInJobs } from "../services/linkedinService";
import { fetchWellfoundJobs } from "../services/wellfoundService";
import { fetchHackerNewsJobs } from "../services/hackerNewsService";
import { fetchUpworkJobs } from "../services/upworkService";
import { batchScoreJobs } from "../services/scoringService";
import { runDayThreeReengagementBatch } from "../services/dayThreeReengagementJob";
import { sendPushNotification } from "../utils/notifications";
import { emitNewJobMatch } from "../realtime/emitters";
import type { AggregatedJobData } from "../services/aggregationTypes";

interface AggregationStats {
  lastRun: Date;
  jobsFetched: number;
  newJobsAdded: number;
  hotJobsFound: number;
  errors: string[];
}

let isRunning = false;
let lastStats: AggregationStats | null = null;

export function startJobAggregator(): void {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    if (!isRunning) {
      await runAggregation();
    } else {
      console.log("[aggregator] Skipping run - previous aggregation still in progress");
    }
  });

  // Also run 10 seconds after server start (give time for DB connection)
  setTimeout(() => {
    void runAggregation();
  }, 10000);

  console.info("[aggregator] Job aggregator started — runs every 15 minutes");

  // Day-3 re-engagement (Template 5): free users, registered 3 calendar days ago (UTC), zero proposals generated
  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        const { scanned, sent } = await runDayThreeReengagementBatch();
        if (sent > 0 || scanned > 0) {
          console.log(
            `[onboarding-email] day-3 re-engagement: scanned=${scanned} sent=${sent}`
          );
        }
      } catch (err) {
        console.error("[onboarding-email] day-3 cron failed:", err);
      }
    },
    { timezone: "UTC" }
  );
  console.info("[aggregator] Day-3 re-engagement email cron — daily 09:00 UTC");
}

export async function runAggregation(): Promise<AggregationStats> {
  if (isRunning) {
    console.log("[aggregator] Already running, skipping");
    return lastStats || createEmptyStats();
  }

  isRunning = true;
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting job aggregation...`);

  const stats: AggregationStats = {
    lastRun: new Date(),
    jobsFetched: 0,
    newJobsAdded: 0,
    hotJobsFound: 0,
    errors: [],
  };

  try {
    // 1. Fetch from all sources in parallel (don't fail if one source errors)
    const [upworkResult, linkedinResult, wellfoundResult, hnResult] =
      await Promise.allSettled([
        fetchUpworkJobs(),
        fetchLinkedInJobs(),
        fetchWellfoundJobs(),
        fetchHackerNewsJobs(),
      ]);

    // Collect results and errors
    const allJobs: AggregatedJobData[] = [];

    if (upworkResult.status === "fulfilled") {
      allJobs.push(...upworkResult.value);
    } else {
      stats.errors.push(`Upwork: ${upworkResult.reason}`);
      console.error("[aggregator] Upwork error:", upworkResult.reason);
    }

    if (linkedinResult.status === "fulfilled") {
      allJobs.push(...linkedinResult.value);
    } else {
      stats.errors.push(`LinkedIn: ${linkedinResult.reason}`);
      console.error("[aggregator] LinkedIn error:", linkedinResult.reason);
    }

    if (wellfoundResult.status === "fulfilled") {
      allJobs.push(...wellfoundResult.value);
    } else {
      stats.errors.push(`Wellfound: ${wellfoundResult.reason}`);
      console.error("[aggregator] Wellfound error:", wellfoundResult.reason);
    }

    if (hnResult.status === "fulfilled") {
      allJobs.push(...hnResult.value);
    } else {
      stats.errors.push(`HackerNews: ${hnResult.reason}`);
      console.error("[aggregator] HackerNews error:", hnResult.reason);
    }

    stats.jobsFetched = allJobs.length;

    if (allJobs.length === 0) {
      console.log("[aggregator] No jobs fetched this cycle");
      lastStats = stats;
      isRunning = false;
      return stats;
    }

    console.log(`[aggregator] Fetched ${allJobs.length} total jobs`);

    // 2. Filter out jobs we already have (by externalId)
    const externalIds = allJobs
      .map((j) => j.externalId)
      .filter((id): id is string => Boolean(id));

    const existingJobs = await Job.find(
      { externalId: { $in: externalIds } },
      { externalId: 1 }
    ).lean();

    const existingSet = new Set(existingJobs.map((j) => j.externalId));
    const newJobs = allJobs.filter((j) => !existingSet.has(j.externalId));

    console.log(
      `[aggregator] ${newJobs.length} new jobs (${allJobs.length - newJobs.length} duplicates skipped)`
    );

    if (newJobs.length === 0) {
      console.log("[aggregator] No new jobs this cycle");
      lastStats = stats;
      isRunning = false;
      return stats;
    }

    // 3. Batch score new jobs using Claude Haiku (cheap & fast)
    console.log(`[aggregator] Scoring ${newJobs.length} new jobs...`);
    const jobsToScore = newJobs.map((j) => ({
      title: j.title,
      budget: j.budget,
      tags: j.tags,
      snippet: j.snippet,
      platform: j.platform,
      client: j.client,
    }));

    const scores = await batchScoreJobs(jobsToScore);

    // Merge scores with job data
    const scoredJobs = newJobs.map((job, i) => ({
      userId: null, // Will be set per-user below
      platform: job.platform,
      title: job.title,
      budget: job.budget,
      posted: job.posted,
      postedAt: new Date(job.posted),
      snippet: job.snippet,
      client: job.client,
      tags: job.tags,
      urgent: job.urgent || false,
      sourceUrl: job.sourceUrl,
      externalId: job.externalId,
      fetchedAt: job.fetchedAt,
      isAggregated: job.isAggregated,
      score: scores[i].score,
      reasons: scores[i].reasons,
      shouldApply: scores[i].shouldApply,
      redFlags: scores[i].redFlags || [],
    }));

    // 4. Save only jobs with score > 60 (per user)
    const goodJobs = scoredJobs.filter((j) => j.score > 60);
    console.log(
      `[aggregator] ${goodJobs.length} jobs scored > 60 (${scoredJobs.length - goodJobs.length} filtered out)`
    );

    if (goodJobs.length > 0) {
      const users = await User.find({}, { _id: 1 }).lean();
      const externalIds = goodJobs
        .map((j) => j.externalId)
        .filter((id): id is string => Boolean(id));

      for (const user of users) {
        const existingForUser = await Job.find(
          {
            userId: user._id,
            externalId: { $in: externalIds },
          },
          { externalId: 1 }
        ).lean();
        const have = new Set(existingForUser.map((j) => j.externalId));

        const userJobs = goodJobs
          .filter((job) => job.externalId && !have.has(job.externalId))
          .map((job) => ({
            ...job,
            userId: user._id,
          }));

        if (!userJobs.length) continue;

        try {
          const inserted = await Job.insertMany(userJobs, { ordered: false });
          stats.newJobsAdded += inserted.length;
        } catch (error: unknown) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code: number }).code === 11000
          ) {
            const bulk = error as {
              insertedDocs?: unknown[];
              writeErrors?: Array<{ code?: number }>;
            };
            if (bulk.insertedDocs?.length) {
              stats.newJobsAdded += bulk.insertedDocs.length;
            } else if (bulk.writeErrors?.length) {
              const ok = bulk.writeErrors.filter((e) => e.code !== 11000).length;
              stats.newJobsAdded += ok;
            }
          } else {
            console.error(`[aggregator] Error saving jobs for user ${user._id}:`, error);
          }
        }
      }

      console.log(`[aggregator] Saved ${stats.newJobsAdded} new jobs across all users`);
    }

    // 5. Notify users about hot jobs (score > 85)
    const hotJobs = scoredJobs.filter((j) => j.score > 85);
    stats.hotJobsFound = hotJobs.length;

    if (hotJobs.length > 0) {
      console.log(`[aggregator] Found ${hotJobs.length} hot jobs (score > 85)`);
      await notifyUsersAboutHotJobs(hotJobs);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[aggregator] Completed in ${elapsed}ms`);

    lastStats = stats;
  } catch (error) {
    console.error("[aggregator] Fatal error during aggregation:", error);
    stats.errors.push(`Fatal: ${error}`);
    lastStats = stats;
  } finally {
    isRunning = false;
  }

  return stats;
}

async function notifyUsersAboutHotJobs(jobs: any[]): Promise<void> {
  // Get all users with push tokens
  const users = await User.find(
    { pushToken: { $exists: true, $ne: null } },
    { pushToken: 1, _id: 1 }
  ).lean();

  if (users.length === 0) {
    console.log("[aggregator] No users with push tokens for notifications");
    return;
  }

  // Notify about top 3 hot jobs only (don't spam)
  const topJobs = jobs.slice(0, 3);

  for (const job of topJobs) {
    for (const user of users) {
      // Socket notification (real-time if app is open)
      emitNewJobMatch(String(user._id), {
        _id: null, // Not saved to DB yet
        title: job.title,
        platform: job.platform,
        budget: job.budget,
        score: job.score,
        tags: job.tags,
        snippet: job.snippet,
      });

      // Push notification (if app is closed)
      if (user.pushToken) {
        try {
          await sendPushNotification(
            user.pushToken,
            "⚡ New high-fit job matched",
            `${job.title} — ${job.budget} (Score: ${job.score})`,
            { type: "job-match", platform: job.platform }
          );
        } catch (error) {
          console.error(`[aggregator] Failed to send push to user ${user._id}:`, error);
        }
      }
    }

    // Wait a bit between notifications to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export function getLastAggregationStats(): AggregationStats | null {
  return lastStats;
}

function createEmptyStats(): AggregationStats {
  return {
    lastRun: new Date(),
    jobsFetched: 0,
    newJobsAdded: 0,
    hotJobsFound: 0,
    errors: [],
  };
}

export { AggregationStats };
