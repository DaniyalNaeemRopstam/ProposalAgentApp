import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { z } from "zod";
import { PipelineDeal, pipelineStages, type PipelineStage } from "../models/PipelineDeal";
import { User } from "../models/User";
import type {
  createDealBodySchema,
  dealIdParamSchema,
  moveStagBodySchema,
  updateDealBodySchema,
} from "../schemas/pipelineSchemas";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/ApiResponse";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a budget string like "$8,000-$15,000" or "$6,000/mo" to a midpoint USD value. */
function parseBudgetValue(budget: string): number {
  const nums = budget.replace(/[^0-9.,-]/g, "").split(/[-,]/).map(Number).filter(Boolean);
  if (!nums.length) return 0;
  return nums.length === 1 ? nums[0] : (nums[0] + nums[nums.length - 1]) / 2;
}

async function findOwnedDeal(id: string, userId: mongoose.Types.ObjectId) {
  const deal = await PipelineDeal.findOne({ _id: id, userId });
  if (!deal) throw ApiError.notFound("Deal not found.");
  return deal;
}

// ─── GET /api/pipeline ────────────────────────────────────────────────────────

export async function listDeals(req: Request, res: Response): Promise<void> {
  const deals = await PipelineDeal.find({ userId: req.user!._id })
    .sort({ updatedAt: -1 })
    .lean();

  // Group by stage, preserving canonical order
  const grouped = Object.fromEntries(
    pipelineStages.map((stage) => [
      stage,
      deals.filter((d) => d.stage === stage),
    ])
  ) as Record<PipelineStage, typeof deals>;

  const totalValue = deals
    .filter((d) => d.stage !== "lost")
    .reduce((sum, d) => sum + (d.budgetValue ?? 0), 0);

  res.json(ok({ grouped, all: deals, totalValue }));
}

// ─── POST /api/pipeline ───────────────────────────────────────────────────────

export async function createDeal(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof createDealBodySchema>;

  const deal = await PipelineDeal.create({
    userId: req.user!._id,
    title: body.title.trim(),
    client: body.client.trim(),
    budget: body.budget.trim(),
    budgetValue: parseBudgetValue(body.budget),
    platform: body.platform.trim(),
    stage: body.stage,
    ...(body.proposalId
      ? { proposalId: new mongoose.Types.ObjectId(body.proposalId) }
      : {}),
    notes: body.notes?.trim(),
    nextAction: body.nextAction?.trim(),
    activityLog: [{ action: `Deal created at stage: ${body.stage}` }],
  });

  res.status(201).json(ok(deal.toObject()));
}

// ─── PUT /api/pipeline/:id ────────────────────────────────────────────────────

export async function updateDeal(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof dealIdParamSchema>;
  const body = req.validated as z.infer<typeof updateDealBodySchema>;

  const deal = await findOwnedDeal(id, req.user!._id);

  if (body.title !== undefined) deal.title = body.title.trim();
  if (body.client !== undefined) deal.client = body.client.trim();
  if (body.platform !== undefined) deal.platform = body.platform.trim();
  if (body.notes !== undefined) deal.notes = body.notes.trim();
  if (body.nextAction !== undefined) deal.nextAction = body.nextAction.trim();

  if (body.budget !== undefined) {
    deal.budget = body.budget.trim();
    deal.budgetValue = parseBudgetValue(body.budget);
  }

  if (body.stage !== undefined) {
    deal.activityLog.push({
      action: `Stage updated to ${body.stage}`,
      fromStage: deal.stage,
      toStage: body.stage,
      at: new Date(),
    });
    deal.stage = body.stage;
  }

  await deal.save();
  res.json(ok(deal.toObject()));
}

// ─── DELETE /api/pipeline/:id ─────────────────────────────────────────────────

export async function deleteDeal(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof dealIdParamSchema>;
  const deleted = await PipelineDeal.findOneAndDelete({ _id: id, userId: req.user!._id });
  if (!deleted) throw ApiError.notFound("Deal not found.");
  res.json(ok({ id, deleted: true }));
}

// ─── PUT /api/pipeline/:id/stage ─────────────────────────────────────────────

export async function moveStage(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof dealIdParamSchema>;
  const body = req.validated as z.infer<typeof moveStagBodySchema>;

  const deal = await findOwnedDeal(id, req.user!._id);
  const prevStage = deal.stage;
  const nextStage = body.stage;

  if (prevStage === nextStage) {
    throw ApiError.conflict(`Deal is already in stage "${nextStage}".`);
  }

  // Log the move
  deal.activityLog.push({
    action: `Moved from ${prevStage} → ${nextStage}`,
    fromStage: prevStage,
    toStage: nextStage,
    note: body.note?.trim(),
    at: new Date(),
  });

  deal.stage = nextStage;

  if (nextStage === "won") {
    const revenue = body.revenueAmount ?? deal.budgetValue ?? 0;

    if (body.revenueAmount !== undefined) {
      deal.budgetValue = body.revenueAmount;
    }

    // Increment user stats atomically
    await User.updateOne(
      { _id: req.user!._id },
      {
        $inc: {
          "stats.projectsWon": 1,
          "stats.revenueWon": revenue,
        },
      }
    );

    // Recompute denormalised win rate
    const user = await User.findById(req.user!._id).lean();
    if (user && user.stats.proposalsSent > 0) {
      const winRate =
        Math.round((user.stats.projectsWon / user.stats.proposalsSent) * 100 * 10) / 10;
      await User.updateOne({ _id: req.user!._id }, { $set: { "stats.winRate": winRate } });
    }
  }

  await deal.save();
  res.json(ok(deal.toObject()));
}
