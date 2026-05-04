import { Router } from "express";
import {
  deleteProposal,
  generate,
  getProposal,
  listProposals,
  updateContent,
  updateStatus,
} from "../controllers/proposalsController";
import { markProposalSent } from "../controllers/sequencesController";
import { requireAuth } from "../middleware/auth";
import { planGuard } from "../middleware/planGuard";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  generateProposalBodySchema,
  listProposalsQuerySchema,
  proposalIdParamSchema,
  updateContentBodySchema,
  updateStatusBodySchema,
} from "../schemas/proposalSchemas";

export const proposalsRouter = Router();

proposalsRouter.use(requireAuth);

// List with optional status / mode filter + pagination
proposalsRouter.get(
  "/",
  validate(listProposalsQuerySchema, "query"),
  asyncHandler(listProposals)
);

// Generate a new proposal — plan quota check then hourly AI rate limit
proposalsRouter.post(
  "/generate",
  asyncHandler(planGuard),
  aiRateLimiter,
  validate(generateProposalBodySchema),
  asyncHandler(generate)
);

// Single proposal
proposalsRouter.get(
  "/:id",
  validate(proposalIdParamSchema, "params"),
  asyncHandler(getProposal)
);

// Update proposal content (user edits)
proposalsRouter.put(
  "/:id/content",
  validate(proposalIdParamSchema, "params"),
  validate(updateContentBodySchema),
  asyncHandler(updateContent)
);

// Advance status lifecycle
proposalsRouter.put(
  "/:id/status",
  validate(proposalIdParamSchema, "params"),
  validate(updateStatusBodySchema),
  asyncHandler(updateStatus)
);

// Mark as sent + auto-generate follow-up sequence via Claude
proposalsRouter.post(
  "/:id/mark-sent",
  asyncHandler(markProposalSent)
);

// Delete only draft proposals
proposalsRouter.delete(
  "/:id",
  validate(proposalIdParamSchema, "params"),
  asyncHandler(deleteProposal)
);
