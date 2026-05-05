import "express-async-errors";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { buildCorsOptions } from "./config/cors";
import { registerRoutes } from "./routes";
import { ApiError } from "./utils/ApiError";
import { fail } from "./utils/ApiResponse";

/**
 * Builds the Express application (middleware + routes + error handler).
 * Used by production bootstrap and integration tests — does not listen or connect MongoDB.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(
    "/api/billing/webhook",
    express.raw({ type: "application/json", limit: process.env.STRIPE_WEBHOOK_BODY_LIMIT || "1mb" })
  );

  const jsonLimit = process.env.JSON_BODY_LIMIT?.trim() || "1mb";

  app.use((req, _res, next) => {
    if (req.path !== "/api/billing/webhook") {
      express.json({ limit: jsonLimit })(req, _res, next);
    } else {
      next();
    }
  });

  registerRoutes(app);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json(fail(err.message));
      return;
    }
    console.error(err);
    res.status(500).json(fail("Internal server error"));
  });

  return app;
}
