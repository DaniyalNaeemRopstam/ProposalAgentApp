import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { resetAiRateBucketsForTests } from "../src/middleware/rateLimiter";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "jest-secret-key-at-least-32-characters-long!!";
process.env.ANTHROPIC_API_KEY = "sk-ant-test-placeholder";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  resetAiRateBucketsForTests();
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
