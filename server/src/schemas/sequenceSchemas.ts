import mongoose from "mongoose";
import { z } from "zod";

const objectIdParam = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid sequence id" });

const proposalObjectIdParam = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid proposal id" });

/** GET /api/sequences query */
export const listSequencesQuerySchema = z.object({
  status: z.enum(["active", "replied", "stopped"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  page: z.coerce.number().min(1).optional().default(1),
});

/** Params :id */
export const sequenceIdParamSchema = z.object({
  id: objectIdParam,
});

/** Params :proposalId — for mark-sent */
export const proposalIdParamSchema = z.object({
  id: proposalObjectIdParam,
});
