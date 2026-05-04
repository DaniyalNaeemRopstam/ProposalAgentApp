import { Router } from "express";
import {
  getDueMessages,
  getSequence,
  listSequences,
  markViewed,
  sendNow,
  stopSequence,
} from "../controllers/sequencesController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listSequencesQuerySchema,
  sequenceIdParamSchema,
} from "../schemas/sequenceSchemas";

export const sequencesRouter = Router();

sequencesRouter.use(requireAuth);

// All active sequences for user (filterable + paginated)
sequencesRouter.get(
  "/",
  validate(listSequencesQuerySchema, "query"),
  asyncHandler(listSequences)
);

// Due messages — for cron inspection / manual trigger UI
sequencesRouter.get("/due", asyncHandler(getDueMessages));

// Single sequence with full message list
sequencesRouter.get(
  "/:id",
  validate(sequenceIdParamSchema, "params"),
  asyncHandler(getSequence)
);

// Stop sequence + skip all pending messages
sequencesRouter.put(
  "/:id/stop",
  validate(sequenceIdParamSchema, "params"),
  asyncHandler(stopSequence)
);

// Mark proposal as viewed (syncs proposal.status)
sequencesRouter.put(
  "/:id/mark-viewed",
  validate(sequenceIdParamSchema, "params"),
  asyncHandler(markViewed)
);

// Manually trigger next pending message
sequencesRouter.post(
  "/:id/send-now",
  validate(sequenceIdParamSchema, "params"),
  asyncHandler(sendNow)
);
