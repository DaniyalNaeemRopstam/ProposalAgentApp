import mongoose from "mongoose";
import { z } from "zod";

/** POST /api/auth/register */
export const registerBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  companyName: z.string().min(1, "Company name is required").max(200),
});

/** POST /api/auth/login */
export const loginBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/** PUT /api/auth/profile */
export const profileUpdateBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    companyName: z.string().min(1).max(200).optional(),
    avatar: z.string().max(4096).optional(),
    voiceProfile: z.string().max(100_000).optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.companyName !== undefined ||
      body.avatar !== undefined ||
      body.voiceProfile !== undefined,
    { message: "Provide at least one field to update" }
  );

/** POST /api/auth/voice-profile */
export const voiceProfileBodySchema = z.object({
  sampleProposals: z
    .array(z.string().min(1, "Each sample must be non-empty"))
    .min(1, "Provide at least one sample proposal"),
});

/** POST /api/auth/project-library */
export const projectLibraryItemBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  client: z.string().min(1, "Client is required").max(200),
  outcome: z.string().min(1, "Outcome is required").max(2000),
  stack: z.array(z.string().max(100)).default([]),
  budget: z.string().min(1, "Budget is required").max(200),
});

const objectIdString = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), { message: "Invalid project id" });

/** DELETE /api/auth/project-library/:id */
export const projectLibraryIdParamSchema = z.object({
  id: objectIdString,
});
