import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import { createApp } from "./createApp";
import { initSocketServer } from "./realtime/socketServer";
import { startCronJobs } from "./utils/cronJobs";

const app = createApp();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/proposalagent";

function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const missing: string[] = [];
  for (const key of ["MONGODB_URI", "JWT_SECRET", "CORS_ORIGINS", "APP_WEB_URL", "STRIPE_WEBHOOK_SECRET"]) {
    if (!process.env[key]?.trim()) missing.push(key);
  }
  if (missing.length) {
    console.error(
      `[bootstrap] Refusing to start: set the following in production: ${missing.join(", ")}`
    );
    process.exit(1);
  }
}

async function bootstrap(): Promise<void> {
  assertProductionEnv();

  await mongoose.connect(mongoUri, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE) || 1,
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_MS) || 10_000,
  });
  console.info("MongoDB connected");

  const server = http.createServer(app);

  initSocketServer(server);

  startCronJobs();

  server.listen(port, () => {
    console.info(`API listening on port ${port}`);
  });
}

bootstrap().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
