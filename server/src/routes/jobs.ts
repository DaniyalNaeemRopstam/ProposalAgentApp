import { Router } from "express";
import {
  deleteJob,
  getJobById,
  listJobs,
  researchClient,
  saveJob,
  scoreJob,
} from "../controllers/jobsController";
import { requireAuth } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  jobIdParamSchema,
  listJobsQuerySchema,
  researchClientBodySchema,
  saveJobBodySchema,
  scoreJobBodySchema,
} from "../schemas/jobsSchemas";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);

jobsRouter.get("/", validate(listJobsQuerySchema, "query"), asyncHandler(listJobs));

jobsRouter.post(
  "/score",
  aiRateLimiter,
  validate(scoreJobBodySchema),
  asyncHandler(scoreJob)
);

jobsRouter.post("/save", aiRateLimiter, validate(saveJobBodySchema), asyncHandler(saveJob));

jobsRouter.post(
  "/research-client",
  aiRateLimiter,
  validate(researchClientBodySchema),
  asyncHandler(researchClient)
);

jobsRouter.get("/:id", validate(jobIdParamSchema, "params"), asyncHandler(getJobById));

jobsRouter.delete("/:id", validate(jobIdParamSchema, "params"), asyncHandler(deleteJob));
