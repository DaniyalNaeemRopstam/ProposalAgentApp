import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { z } from "zod";
import { Proposal } from "../models/Proposal";
import { Sequence } from "../models/Sequence";
import { User } from "../models/User";
import type {
  listSequencesQuerySchema,
  sequenceIdParamSchema,
} from "../schemas/sequenceSchemas";
import { generateFollowUpMessages, scheduledDate } from "../services/sequenceService";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/ApiResponse";
import { sendPushNotification } from "../utils/notifications";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function notifyProposalMarkedSentPush(userId: mongoose.Types.ObjectId): Promise<void> {
  const u = await User.findById(userId).select("pushToken").lean();
  if (!u?.pushToken) return;
  await sendPushNotification(
    u.pushToken,
    "✅ Proposal sent!",
    "Follow-up sequence started",
    { type: "sequence" }
  ).catch(() => void 0);
}

async function findOwnedSequence(id: string, userId: mongoose.Types.ObjectId) {
  const seq = await Sequence.findOne({ _id: id, userId });
  if (!seq) throw ApiError.notFound("Sequence not found.");
  return seq;
}

// ─── POST /api/proposals/:id/mark-sent ───────────────────────────────────────
// Creates proposal sentAt, sets status='sent', generates follow-up sequence.

export async function markProposalSent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest("Invalid proposal id.");
  }

  // Load proposal and verify ownership
  const proposal = await Proposal.findOne({ _id: id, userId: req.user!._id });
  if (!proposal) throw ApiError.notFound("Proposal not found.");

  if (proposal.status === "sent") {
    throw ApiError.conflict("Proposal is already marked as sent.");
  }

  // Mark the proposal sent
  const sentAt = new Date();
  proposal.status = "sent";
  proposal.sentAt = sentAt;
  await proposal.save();

  // Update user stats
  await User.updateOne(
    { _id: req.user!._id },
    { $inc: { "stats.proposalsSent": 1 } }
  ).catch(() => void 0); // non-fatal

  // Bail out if a sequence already exists for this proposal
  const existing = await Sequence.findOne({ proposalId: proposal._id });
  if (existing) {
    void notifyProposalMarkedSentPush(req.user!._id);
    res.json(
      ok({
        proposal: proposal.toObject(),
        sequence: existing.toObject(),
        sequenceCreated: false,
      })
    );
    return;
  }

  // Load user context for Claude prompts
  const user = await User.findById(req.user!._id).lean();
  if (!user) throw ApiError.unauthorized("Account not found.");

  const jobTitle = (proposal.job as { title?: string })?.title ?? "your project";
  const platform = (proposal.job as { platform?: string })?.platform ?? "Upwork";
  const clientName =
    (proposal.job as { client?: { name?: string } })?.client?.name ?? undefined;

  // Generate all 3 follow-up message bodies via Claude (parallel)
  const messageBodies = await generateFollowUpMessages({
    jobTitle,
    platform,
    proposalSnippet: proposal.content.slice(0, 400),
    clientName,
    userName: user.name,
    userCompanyName: user.companyName,
  });

  // Build message subdocuments
  const messages = messageBodies.map(({ day, content }) => ({
    day,
    content,
    status: "pending" as const,
    scheduledAt: scheduledDate(sentAt, day),
  }));

  const sequence = await Sequence.create({
    proposalId: proposal._id,
    userId: req.user!._id,
    jobTitle,
    platform,
    status: "active",
    viewed: false,
    messages,
  });

  void notifyProposalMarkedSentPush(req.user!._id);

  res.status(201).json(
    ok({
      proposal: proposal.toObject(),
      sequence: sequence.toObject(),
      sequenceCreated: true,
    })
  );
}

// ─── GET /api/sequences ───────────────────────────────────────────────────────

export async function listSequences(req: Request, res: Response): Promise<void> {
  const q = req.validated as z.infer<typeof listSequencesQuerySchema>;

  const filter: Record<string, unknown> = { userId: req.user!._id };
  if (q.status) filter.status = q.status;

  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Sequence.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(q.limit)
      .populate("proposalId", "mode variant proposalScore status sentAt")
      .lean(),
    Sequence.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / q.limit));

  res.json(
    ok({
      sequences: items,
      pagination: { page: q.page, limit: q.limit, total, totalPages },
    })
  );
}

// ─── GET /api/sequences/:id ───────────────────────────────────────────────────

export async function getSequence(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof sequenceIdParamSchema>;

  const seq = await Sequence.findOne({ _id: id, userId: req.user!._id })
    .populate("proposalId", "mode variant proposalScore status sentAt content")
    .lean();

  if (!seq) throw ApiError.notFound("Sequence not found.");
  res.json(ok(seq));
}

// ─── GET /api/sequences/due ──────────────────────────────────────────────────

export async function getDueMessages(req: Request, res: Response): Promise<void> {
  const now = new Date();

  const sequences = await Sequence.find({
    userId: req.user!._id,
    status: "active",
    "messages.status": "pending",
    "messages.scheduledAt": { $lte: now },
  }).lean();

  const due: Array<{
    sequenceId: unknown;
    jobTitle: string;
    platform: string;
    message: unknown;
  }> = [];

  for (const seq of sequences) {
    const dueMessages = seq.messages.filter(
      (m) => m.status === "pending" && m.scheduledAt <= now
    );
    for (const m of dueMessages) {
      due.push({
        sequenceId: seq._id,
        jobTitle: seq.jobTitle,
        platform: seq.platform,
        message: m,
      });
    }
  }

  res.json(ok({ due, count: due.length }));
}

// ─── PUT /api/sequences/:id/stop ─────────────────────────────────────────────

export async function stopSequence(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof sequenceIdParamSchema>;
  const seq = await findOwnedSequence(id, req.user!._id);

  if (seq.status === "stopped") {
    throw ApiError.conflict("Sequence is already stopped.");
  }

  seq.status = "stopped";
  // Mark all pending messages as skipped
  for (const msg of seq.messages) {
    if (msg.status === "pending") {
      msg.status = "skipped";
    }
  }
  await seq.save();

  res.json(ok(seq.toObject()));
}

// ─── PUT /api/sequences/:id/mark-viewed ──────────────────────────────────────

export async function markViewed(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof sequenceIdParamSchema>;
  const seq = await findOwnedSequence(id, req.user!._id);

  seq.viewed = true;
  await seq.save();

  // Also update linked proposal status to 'viewed' if it's still 'sent'
  await Proposal.updateOne(
    { _id: seq.proposalId, status: "sent" },
    { $set: { status: "viewed" } }
  );

  res.json(ok(seq.toObject()));
}

// ─── POST /api/sequences/:id/send-now ────────────────────────────────────────

export async function sendNow(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof sequenceIdParamSchema>;
  const seq = await findOwnedSequence(id, req.user!._id);

  if (seq.status !== "active") {
    throw ApiError.conflict("Only active sequences can have messages sent.");
  }

  // Find the next pending message (lowest day number)
  const pendingIdx = seq.messages
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.status === "pending")
    .sort((a, b) => a.m.day - b.m.day)[0];

  if (!pendingIdx) {
    throw ApiError.badRequest(
      "No pending messages remain in this sequence. All have been sent or skipped."
    );
  }

  const now = new Date();
  seq.messages[pendingIdx.i].status = "sent";
  seq.messages[pendingIdx.i].sentAt = now;

  // If this was the last pending message, mark sequence as stopped
  const remainingPending = seq.messages.filter(
    (m, i) => i !== pendingIdx.i && m.status === "pending"
  );
  if (remainingPending.length === 0) {
    seq.status = "stopped";
  }

  await seq.save();

  res.json(
    ok({
      sequence: seq.toObject(),
      sentMessage: seq.messages[pendingIdx.i].toObject(),
    })
  );
}
