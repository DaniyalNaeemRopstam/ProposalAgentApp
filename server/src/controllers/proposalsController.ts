import type { Request, Response } from "express";
import type { z } from "zod";
import mongoose from "mongoose";
import { Proposal } from "../models/Proposal";
import { User } from "../models/User";
import { generateProposal } from "../services/proposalService";
import type {
  generateProposalBodySchema,
  listProposalsQuerySchema,
  proposalIdParamSchema,
  updateContentBodySchema,
  updateStatusBodySchema,
} from "../schemas/proposalSchemas";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/ApiResponse";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function loadUser(req: Request) {
  const user = await User.findById(req.user!._id).lean();
  if (!user) throw ApiError.unauthorized("Account not found.");
  return user;
}

async function findOwnedProposal(proposalId: string, userId: mongoose.Types.ObjectId) {
  const doc = await Proposal.findOne({ _id: proposalId, userId }).lean();
  if (!doc) throw ApiError.notFound("Proposal not found.");
  return doc;
}

// ─── POST /api/proposals/generate ────────────────────────────────────────────

export async function generate(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof generateProposalBodySchema>;
  const user = await loadUser(req);

  const result = await generateProposal({
    jobTitle: body.jobTitle,
    jobDescription: body.jobDescription,
    jobBudget: body.jobBudget,
    platform: body.platform,
    clientName: body.clientName,
    clientCountry: body.clientCountry,
    tags: body.tags,
    mode: body.mode,
    variant: body.variant,
    user: {
      name: user.name,
      companyName: user.companyName,
      plan: user.plan,
      voiceProfile: user.voiceProfile,
      projectLibrary: user.projectLibrary,
    },
  });

  const jobSnapshot = {
    title: body.jobTitle,
    budget: body.jobBudget,
    platform: body.platform,
    snippet: body.jobDescription.slice(0, 500),
    tags: body.tags,
    client: { name: body.clientName, country: body.clientCountry },
  };

  const proposal = await Proposal.create({
    userId: req.user!._id,
    ...(body.jobId ? { jobId: new mongoose.Types.ObjectId(body.jobId) } : {}),
    job: jobSnapshot,
    mode: body.mode,
    variant: body.variant,
    content: result.content,
    wordCount: result.wordCount,
    replyProbability: result.replyProbability,
    proposalScore: result.proposalScore,
    status: "draft",
  });

  // Increment proposalsSent on user stats
  await User.updateOne(
    { _id: req.user!._id },
    { $inc: { "stats.proposalsSent": 1 } }
  );

  res.status(201).json(
    ok({
      proposal: proposal.toObject(),
      wordCount: result.wordCount,
      replyProbability: result.replyProbability,
      proposalScore: result.proposalScore,
    })
  );
}

// ─── GET /api/proposals ───────────────────────────────────────────────────────

export async function listProposals(req: Request, res: Response): Promise<void> {
  const q = req.validated as z.infer<typeof listProposalsQuerySchema>;

  const filter: Record<string, unknown> = { userId: req.user!._id };
  if (q.status) filter.status = q.status;
  if (q.mode) filter.mode = q.mode;

  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Proposal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
    Proposal.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / q.limit));

  res.json(
    ok({
      proposals: items,
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

// ─── GET /api/proposals/:id ───────────────────────────────────────────────────

export async function getProposal(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof proposalIdParamSchema>;
  const doc = await findOwnedProposal(id, req.user!._id);
  res.json(ok(doc));
}

// ─── PUT /api/proposals/:id/status ───────────────────────────────────────────

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof proposalIdParamSchema>;
  const body = req.validated as z.infer<typeof updateStatusBodySchema>;

  // body has already been merged from two validate() calls — see routes file
  const updated = await Proposal.findOneAndUpdate(
    { _id: id, userId: req.user!._id },
    {
      $set: {
        status: body.status,
        ...(body.status === "sent" ? { sentAt: new Date() } : {}),
        ...(body.status === "replied" ? { repliedAt: new Date() } : {}),
      },
    },
    { new: true }
  ).lean();

  if (!updated) throw ApiError.notFound("Proposal not found.");

  // Mirror relevant pipeline-level stats back to user
  if (body.status === "won") {
    await User.updateOne(
      { _id: req.user!._id },
      { $inc: { "stats.projectsWon": 1 } }
    );
  }
  if (body.status === "replied") {
    await User.updateOne(
      { _id: req.user!._id },
      { $inc: { "stats.repliesReceived": 1 } }
    );
  }

  res.json(ok(updated));
}

// ─── PUT /api/proposals/:id/content ──────────────────────────────────────────

export async function updateContent(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof proposalIdParamSchema>;
  const body = req.validated as z.infer<typeof updateContentBodySchema>;

  const newWordCount = body.content.trim().split(/\s+/).filter(Boolean).length;

  const updated = await Proposal.findOneAndUpdate(
    { _id: id, userId: req.user!._id },
    { $set: { content: body.content, wordCount: newWordCount } },
    { new: true }
  ).lean();

  if (!updated) throw ApiError.notFound("Proposal not found.");
  res.json(ok(updated));
}

// ─── DELETE /api/proposals/:id ────────────────────────────────────────────────

export async function deleteProposal(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof proposalIdParamSchema>;

  const deleted = await Proposal.findOneAndDelete({
    _id: id,
    userId: req.user!._id,
    status: "draft",
  }).lean();

  if (!deleted) {
    throw ApiError.notFound(
      "Proposal not found, or only draft proposals can be deleted."
    );
  }

  res.json(ok({ id, deleted: true }));
}
