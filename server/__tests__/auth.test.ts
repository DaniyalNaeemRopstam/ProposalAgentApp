import request from "supertest";
import { createApp } from "../src/createApp";

const app = createApp();

const sampleUser = {
  name: "Test User",
  email: `test-auth-${Date.now()}@example.com`,
  password: "password123",
  companyName: "Test Co LLC",
};

describe("POST /api/auth/register", () => {
  it("creates account and returns token", async () => {
    const res = await request(app).post("/api/auth/register").send(sampleUser).expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeTruthy();
    expect(res.body.data?.user?.email).toBe(sampleUser.email.toLowerCase());
  });

  it("rejects duplicate email with 409", async () => {
    const email = `dup-${Date.now()}@example.com`;
    const body = { ...sampleUser, email };
    await request(app).post("/api/auth/register").send(body).expect(201);
    const dup = await request(app).post("/api/auth/register").send(body).expect(409);

    expect(dup.body.success).toBe(false);
    expect(String(dup.body.message)).toMatch(/already exists/i);
  });
});

describe("POST /api/auth/login", () => {
  it("returns token with valid credentials", async () => {
    const email = `login-${Date.now()}@example.com`;
    await request(app).post("/api/auth/register").send({ ...sampleUser, email }).expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: sampleUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.token).toBeTruthy();
  });

  it("returns 401 for wrong password", async () => {
    const email = `bad-pass-${Date.now()}@example.com`;
    await request(app).post("/api/auth/register").send({ ...sampleUser, email }).expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong-password-xyz" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/auth/me", () => {
  it("returns user with valid Bearer token", async () => {
    const email = `me-${Date.now()}@example.com`;
    const reg = await request(app).post("/api/auth/register").send({ ...sampleUser, email }).expect(201);
    const token = reg.body.data.token as string;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.email).toBe(email.toLowerCase());
  });

  it("returns 401 for invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer totally.invalid.jwt.token")
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
