import { Router } from "express";
import {
  createDeal,
  deleteDeal,
  listDeals,
  moveStage,
  updateDeal,
} from "../controllers/pipelineController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createDealBodySchema,
  dealIdParamSchema,
  moveStagBodySchema,
  updateDealBodySchema,
} from "../schemas/pipelineSchemas";
import { asyncHandler } from "../utils/asyncHandler";

export const pipelineRouter = Router();

pipelineRouter.use(requireAuth);

pipelineRouter.get("/", asyncHandler(listDeals));

pipelineRouter.post(
  "/",
  validate(createDealBodySchema, "body"),
  asyncHandler(createDeal)
);

pipelineRouter.put(
  "/:id",
  validate(dealIdParamSchema, "params"),
  validate(updateDealBodySchema, "body"),
  asyncHandler(updateDeal)
);

pipelineRouter.delete(
  "/:id",
  validate(dealIdParamSchema, "params"),
  asyncHandler(deleteDeal)
);

pipelineRouter.put(
  "/:id/stage",
  validate(dealIdParamSchema, "params"),
  validate(moveStagBodySchema, "body"),
  asyncHandler(moveStage)
);
