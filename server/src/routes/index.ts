import type { Express } from "express";
import { analyticsRouter } from "./analytics";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { healthRouter } from "./health";
import { jobsRouter } from "./jobs";
import { pipelineRouter } from "./pipeline";
import { proposalsRouter } from "./proposals";
import { sequencesRouter } from "./sequences";
import { usersRouter } from "./users";

export function registerRoutes(app: Express): void {
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/proposals", proposalsRouter);
  app.use("/api/sequences", sequencesRouter);
  app.use("/api/pipeline", pipelineRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/billing", billingRouter);
}
