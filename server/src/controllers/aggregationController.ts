import { Router } from "express";
import { Job } from "../models/Job";
import { requireAuth } from "../middleware/auth";
import {
  aggregateJobs,
  aggregateJobsInParallel,
} from "../services/jobAggregationService";

const router = Router();

router.post("/aggregate", requireAuth, async (req, res) => {
  try {
    const { parallel = true, sources } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const options = {
      sources: sources || undefined,
    };

    const result = parallel
      ? await aggregateJobsInParallel(options)
      : await aggregateJobs(options);

    if (result.success.length === 0) {
      return res.status(200).json({
        message: "No jobs found from the requested sources",
        errors: result.errors,
        timestamp: result.timestamp,
      });
    }

    const createdJobs = [];

    for (const jobData of result.success) {
      try {
        const existingJob = await Job.findOne({
          userId: req.user._id,
          externalId: jobData.externalId,
          platform: jobData.platform,
        });

        if (existingJob) {
          console.log(
            `Job already exists: ${jobData.externalId} from ${jobData.platform}`
          );
          continue;
        }

        const job = new Job({
          userId: req.user._id,
          platform: jobData.platform,
          title: jobData.title,
          budget: jobData.budget,
          posted: jobData.posted,
          postedAt: new Date(jobData.posted),
          snippet: jobData.snippet,
          client: jobData.client,
          tags: jobData.tags,
          urgent: jobData.urgent || false,
          sourceUrl: jobData.sourceUrl,
          externalId: jobData.externalId,
          fetchedAt: jobData.fetchedAt,
          isAggregated: jobData.isAggregated,
          score: 0,
        });

        const saved = await job.save();
        createdJobs.push(saved);
      } catch (error) {
        console.error(`Error saving job from ${jobData.platform}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      jobsAggregated: result.totalFetched,
      jobsCreated: createdJobs.length,
      jobsDuplicated: result.totalFetched - createdJobs.length,
      errors: result.errors,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Error during job aggregation:", error);
    return res.status(500).json({
      error: "Failed to aggregate jobs",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/aggregated", requireAuth, async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const jobs = await Job.find({
      userId: req.user._id,
      isAggregated: true,
    })
      .sort({ fetchedAt: -1 })
      .limit(100);

    return res.status(200).json({
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching aggregated jobs:", error);
    return res.status(500).json({
      error: "Failed to fetch aggregated jobs",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
