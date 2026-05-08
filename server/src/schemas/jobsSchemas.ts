import mongoose from "mongoose";
import { z } from "zod";

export const PLATFORM_VALUES = [
  "Upwork",
  "LinkedIn",
  "Wellfound",
  "Freelancer",
  "HackerNews",
  "Custom",
] as const;

const objectIdParam = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid job id" });

/** GET /api/jobs query */
export const listJobsQuerySchema = z.object({
  platform: z.enum(PLATFORM_VALUES).optional(),
  /** Filter by aggregation source */
  source: z.enum(["all", "aggregated", "manual"]).optional().default("all"),
  minScore: z.coerce.number().min(0).max(100).optional().default(60),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  page: z.coerce.number().min(1).optional().default(1),
});

/** POST /api/jobs/score */
export const scoreJobBodySchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  jobBudget: z.string().min(1, "Budget is required"),
  jobTags: z.array(z.string()).default([]),
  clientInfo: z.object({
    name: z.string().min(1),
    country: z.string().min(1),
    spent: z.string().optional(),
    rating: z.number().optional(),
    hires: z.number().optional(),
    verified: z.boolean().optional(),
  }),
  competition: z.string().optional().default("unknown"),
  postedRecency: z.string().optional().default("unknown"),
});

const clientShape = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  spent: z.string().optional(),
  rating: z.number().optional(),
  hires: z.number().optional(),
  verified: z.boolean().optional().default(false),
});

/** POST /api/jobs/save */
export const saveJobBodySchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  title: z.string().min(1),
  budget: z.string().min(1),
  posted: z.string().min(1),
  postedAt: z.coerce.date().optional(),
  urgent: z.boolean().optional().default(false),
  client: clientShape,
  tags: z.array(z.string()).default([]),
  snippet: z.string().min(1),
  fullDescription: z.string().optional(),
  competition: z.string().optional().default(""),
  timeline: z.string().optional().default(""),
  url: z.string().optional(),
});

/** Params :id */
export const jobIdParamSchema = z.object({
  id: objectIdParam,
});

/** POST /api/jobs/research-client */
export const researchClientBodySchema = z.object({
  clientName: z.string().min(1),
  country: z.string().min(1),
  platform: z.string().min(1),
});
