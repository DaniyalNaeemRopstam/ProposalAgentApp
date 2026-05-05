import request from "supertest";
import { createApp } from "../src/createApp";

const app = createApp();

describe("GET /health", () => {
  it("returns 200 and status ok", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.version).toBe("1.0.0");
    expect(res.body.timestamp).toBeDefined();
  });
});
