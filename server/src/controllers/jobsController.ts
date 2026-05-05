import type { Request, Response } from "express";
import type { z } from "zod";
import { Job } from "../models/Job";
import { User } from "../models/User";
import type {
  jobIdParamSchema,
  listJobsQuerySchema,
  researchClientBodySchema,
  saveJobBodySchema,
  scoreJobBodySchema,
} from "../schemas/jobsSchemas";
import { researchClientWithClaude, scoreJobWithClaude } from "../services/jobsAIService";
import { ApiError } from "../utils/ApiError";
import { emitNewJobMatch } from "../realtime/emitters";
import { ok } from "../utils/ApiResponse";
import { sendPushNotification } from "../utils/notifications";

type ProfileForScoring = {
  name: string;
  companyName: string;
  plan?: string;
  voiceProfile?: string | null;
  stats?: { proposalsSent?: number; projectsWon?: number; revenueWon?: number };
  projectLibrary?: Array<{
    title: string;
    client: string;
    budget: string;
    stack?: string[];
  }>;
};

function buildUserContextBlock(user: ProfileForScoring): string {
  const libLines = (user.projectLibrary ?? [])
    .map(
      (p) =>
        `- ${p.title} | client: ${p.client} | budget: ${p.budget} | stack: ${p.stack?.join(", ") || "—"}`
    )
    .join("\n");

  const statsLine = `Stats snapshot: proposals sent ${user.stats?.proposalsSent ?? 0}, projects won ${user.stats?.projectsWon ?? 0}, revenue ${user.stats?.revenueWon ?? 0}`;

  return [
    `Represented contractor: ${user.name} (${user.companyName})`,
    `Plan: ${user.plan ?? "free"}`,
    statsLine,
    user.voiceProfile
      ? `Voice/strategy notes: ${user.voiceProfile.slice(0, 2000)}${user.voiceProfile.length > 2000 ? "…" : ""}`
      : "",
    "Past project catalogue (signals for realistic budget/stack fit):",
    libLines ? libLines : "- (none on file yet)",
  ]
    .filter(Boolean)
    .join("\n");
}

async function loadUserOrThrow(req: Request): Promise<ProfileForScoring> {
  const user = await User.findById(req.user!._id).lean();
  if (!user) {
    throw ApiError.unauthorized("Account not found.");
  }
  return user as ProfileForScoring;
}

export async function listJobs(req: Request, res: Response): Promise<void> {
  const q = req.validated as z.infer<typeof listJobsQuerySchema>;
  const filter: Record<string, unknown> = {
    userId: req.user!._id,
    archived: false,
    score: { $gte: q.minScore },
  };
  if (q.platform) {
    filter.platform = q.platform;
  }

  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Job.find(filter)
      .sort({ score: -1, postedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(q.limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / q.limit));

  res.json(
    ok({
      jobs: items,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrev: q.page > 1,
      },
    })
  );
}

export async function scoreJob(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof scoreJobBodySchema>;
  const user = await loadUserOrThrow(req);
  const ctx = buildUserContextBlock(user);

  const result = await scoreJobWithClaude({
    userContextBlock: ctx,
    jobTitle: body.jobTitle,
    jobDescription: body.jobDescription,
    jobBudget: body.jobBudget,
    jobTags: body.jobTags,
    clientInfo: body.clientInfo,
    competition: body.competition,
    postedRecency: body.postedRecency,
  });

  res.json(ok(result));
}

export async function saveJob(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof saveJobBodySchema>;
  const user = await loadUserOrThrow(req);
  const ctx = buildUserContextBlock(user);

  const description = body.fullDescription?.trim() || body.snippet.trim();
  const result = await scoreJobWithClaude({
    userContextBlock: ctx,
    jobTitle: body.title.trim(),
    jobDescription: description,
    jobBudget: body.budget.trim(),
    jobTags: body.tags,
    clientInfo: body.client as unknown as Record<string, unknown>,
    competition: body.competition.trim() || "unknown",
    postedRecency: body.posted.trim(),
  });

  const postedAt =
    body.postedAt instanceof Date
      ? body.postedAt
      : body.postedAt
        ? new Date(body.postedAt)
        : new Date();

  const rounded = Math.round(result.score);

  const job = await Job.create({
    userId: req.user!._id,
    platform: body.platform,
    title: body.title.trim(),
    budget: body.budget.trim(),
    posted: body.posted.trim(),
    postedAt,
    urgent: Boolean(body.urgent),
    client: {
      name: body.client.name.trim(),
      country: body.client.country.trim(),
      spent: body.client.spent?.trim(),
      rating: body.client.rating,
      hires: body.client.hires,
      verified: Boolean(body.client.verified),
    },
    tags: body.tags,
    snippet: body.snippet.trim(),
    fullDescription: body.fullDescription?.trim(),
    competition: body.competition.trim(),
    timeline: body.timeline.trim(),
    url: body.url?.trim(),
    score: rounded,
    reasons: result.reasons,
    shouldApply: result.shouldApply,
    redFlags: result.redFlags,
    savedAt: new Date(),
  });

  if (rounded > 80) {
    emitNewJobMatch(req.user!._id.toString(), job.toObject());
  }

  if (rounded > 85) {
    void (async () => {
      const u = await User.findById(req.user!._id).select("pushToken").lean();
      if (!u?.pushToken) return;
      await sendPushNotification(
        u.pushToken,
        `⚡ New match: ${body.title.trim()}`,
        "Tap to open Jobs and draft your proposal.",
        { type: "job" }
      ).catch(() => void 0);
    })();
  }

  res.status(201).json(ok(job.toJSON()));
}

export async function getJobById(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof jobIdParamSchema>;
  const job = await Job.findOne({
    _id: id,
    userId: req.user!._id,
    archived: false,
  }).lean();

  if (!job) {
    throw ApiError.notFound("Job not found.");
  }

  res.json(ok(job));
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof jobIdParamSchema>;
  const updated = await Job.findOneAndUpdate(
    { _id: id, userId: req.user!._id, archived: false },
    { archived: true },
    { new: true }
  );

  if (!updated) {
    throw ApiError.notFound("Job not found or already archived.");
  }

  res.json(ok({ id: updated.id, archived: true }));
}

export async function researchClient(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof researchClientBodySchema>;
  const payload = await researchClientWithClaude({
    clientName: body.clientName.trim(),
    country: body.country.trim(),
    platform: body.platform.trim(),
  });
  res.json(ok(payload));
}
