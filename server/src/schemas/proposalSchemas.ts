import mongoose from "mongoose";
import { z } from "zod";

const objectIdParam = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid proposal id" });

/** POST /api/proposals/generate */
export const generateProposalBodySchema = z.object({
  jobId: z
    .string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid jobId" })
    .optional(),
  jobTitle: z.string().min(1, "Job title is required").max(500),
  jobDescription: z.string().min(10, "Job description must be at least 10 characters"),
  jobBudget: z.string().min(1, "Budget is required"),
  platform: z.string().min(1, "Platform is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientCountry: z.string().min(1, "Client country is required"),
  tags: z.array(z.string().max(100)).default([]),
  mode: z.enum(["upwork", "linkedin", "email"]),
  variant: z.enum(["quality", "price", "speed"]),
});

/** GET /api/proposals query */
export const listProposalsQuerySchema = z.object({
  status: z
    .enum(["draft", "sent", "viewed", "replied", "shortlisted", "won", "lost"])
    .optional(),
  mode: z.enum(["upwork", "linkedin", "email"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  page: z.coerce.number().min(1).optional().default(1),
});

/** PUT /api/proposals/:id/status */
export const updateStatusBodySchema = z.object({
  status: z.enum(["draft", "sent", "viewed", "replied", "shortlisted", "won", "lost"]),
});

/** PUT /api/proposals/:id/content */
export const updateContentBodySchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
});

/** Params :id */
export const proposalIdParamSchema = z.object({
  id: objectIdParam,
});
