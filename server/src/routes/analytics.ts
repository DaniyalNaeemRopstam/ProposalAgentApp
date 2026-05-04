import { Router } from "express";
import {
  bestTime,
  insights,
  monthly,
  overview,
  platforms,
} from "../controllers/analyticsController";
import { requireAuth } from "../middleware/auth";
import { planGuard } from "../middleware/planGuard";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../utils/asyncHandler";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/overview", asyncHandler(overview));
analyticsRouter.get("/monthly", asyncHandler(monthly));
analyticsRouter.get("/platforms", asyncHandler(platforms));
analyticsRouter.get("/best-time", asyncHandler(bestTime));

// Insights calls Claude — check plan quota then hourly AI rate limit
analyticsRouter.get(
  "/insights",
  asyncHandler(planGuard),
  aiRateLimiter,
  asyncHandler(insights)
);
