import mongoose from "mongoose";
import { z } from "zod";
import { pipelineStages } from "../models/PipelineDeal";

const objectIdParam = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid deal id" });

const stageEnum = z.enum(pipelineStages);

/** POST /api/pipeline */
export const createDealBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  client: z.string().min(1, "Client is required").max(300),
  budget: z.string().min(1, "Budget is required").max(200),
  platform: z.string().min(1, "Platform is required").max(100),
  stage: stageEnum.optional().default("applied"),
  proposalId: z
    .string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid proposalId" })
    .optional(),
  notes: z.string().max(5000).optional(),
  nextAction: z.string().max(1000).optional(),
});

/** PUT /api/pipeline/:id */
export const updateDealBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    client: z.string().min(1).max(300).optional(),
    budget: z.string().min(1).max(200).optional(),
    platform: z.string().min(1).max(100).optional(),
    stage: stageEnum.optional(),
    notes: z.string().max(5000).optional(),
    nextAction: z.string().max(1000).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

/** PUT /api/pipeline/:id/stage */
export const moveStagBodySchema = z.object({
  stage: stageEnum,
  note: z.string().max(500).optional(),
  /** Revenue amount in USD — required when moving to 'won' */
  revenueAmount: z.number().min(0).optional(),
});

/** Params :id */
export const dealIdParamSchema = z.object({ id: objectIdParam });
