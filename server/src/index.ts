import "express-async-errors";
import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { registerRoutes } from "./routes";
import { ApiError } from "./utils/ApiError";
import { fail } from "./utils/ApiResponse";
import { startCronJobs } from "./utils/cronJobs";

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/proposalagent";

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Stripe webhook requires the raw Buffer — must be registered BEFORE express.json()
app.use(
  "/api/billing/webhook",
  express.raw({ type: "application/json" })
);

// All other routes get the normal JSON body parser
app.use((req, _res, next) => {
  if (req.path !== "/api/billing/webhook") {
    express.json({ limit: "1mb" })(req, _res, next);
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

async function bootstrap(): Promise<void> {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  startCronJobs();

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
