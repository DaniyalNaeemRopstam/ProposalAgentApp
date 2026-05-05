import type { Request, Response } from "express";
import type { z } from "zod";
import mongoose from "mongoose";
import { Proposal } from "../models/Proposal";
import { User } from "../models/User";
import { emitStatsUpdated } from "../realtime/emitters";
import { generateProposal, generateProposalStreaming } from "../services/proposalService";
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

async function finalizeGeneratedProposal(opts: {
  req: Request;
  body: z.infer<typeof generateProposalBodySchema>;
  result: {
    content: string;
    wordCount: number;
    replyProbability: number;
    proposalScore: number;
  };
}) {
  const { req, body, result } = opts;

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

  await User.updateOne({ _id: req.user!._id }, { $inc: { "stats.proposalsSent": 1 } });
  await emitStatsUpdated(req.user!._id.toString());

  return proposal;
}

// ─── POST /api/proposals/generate ────────────────────────────────────────────

export async function generate(req: Request, res: Response): Promise<void> {
  const accept = req.headers.accept ?? "";
  if (accept.includes("text/event-stream")) {
    await generateSse(req, res);
    return;
  }

  await generateJson(req, res);
}

async function generateJson(req: Request, res: Response): Promise<void> {
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

  const proposal = await finalizeGeneratedProposal({ req, body, result });

  res.status(201).json(
    ok({
      proposal: proposal.toObject(),
      wordCount: result.wordCount,
      replyProbability: result.replyProbability,
      proposalScore: result.proposalScore,
    })
  );
}

async function generateSse(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof generateProposalBodySchema>;
  const user = await loadUser(req);

  const input = {
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
  };

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  (res as Response & { flushHeaders?: () => void }).flushHeaders?.();

  const writeSse = (obj: object) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    const result = await generateProposalStreaming(input, (chunk) => {
      writeSse({ chunk });
    });

    const proposal = await finalizeGeneratedProposal({ req, body, result });

    writeSse({
      done: true,
      proposalId: proposal._id.toString(),
      score: result.proposalScore,
      replyProbability: result.replyProbability,
      wordCount: result.wordCount,
    });
    res.end();
  } catch (err: unknown) {
    const msg =
      err &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : "Proposal generation failed.";
    writeSse({ error: msg });
    res.end();
  }
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

  if (body.status === "won" || body.status === "replied") {
    await emitStatsUpdated(req.user!._id.toString());
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
