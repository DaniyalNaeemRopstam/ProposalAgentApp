import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/createApp";
import { User } from "../src/models/User";

jest.mock("../src/services/proposalService", () => ({
  generateProposal: jest.fn().mockResolvedValue({
    content: "This is a mocked proposal body with enough text for persistence.",
    wordCount: 10,
    replyProbability: 72,
    proposalScore: 84,
  }),
  generateProposalStreaming: jest.fn(),
}));

const app = createApp();

const validGenerateBody = {
  jobTitle: "Senior React Developer",
  jobDescription: "We need ten chars min for description validation here.",
  jobBudget: "$5,000–$12,000",
  platform: "Upwork",
  clientName: "ACME Labs",
  clientCountry: "United States",
  tags: ["react"],
  mode: "upwork" as const,
  variant: "quality" as const,
};

async function registerAndToken(): Promise<string> {
  const email = `prop-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const reg = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Proposal Tester",
      email,
      password: "password123",
      companyName: "Forge LLC",
    })
    .expect(201);

  return reg.body.data.token as string;
}

describe("POST /api/proposals/generate", () => {
  it("validates required fields (400)", async () => {
    const token = await registerAndToken();
    const res = await request(app)
      .post("/api/proposals/generate")
      .set("Authorization", `Bearer ${token}`)
      .set("Accept", "application/json")
      .send({ jobTitle: "" })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it("returns 403 when free plan quota exceeded (plan guard)", async () => {
    const token = await registerAndToken();
    const loginRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
    const userId = loginRes.body.data._id as string;

    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { totalProposalsGenerated: 3 } }
    );

    const res = await request(app)
      .post("/api/proposals/generate")
      .set("Authorization", `Bearer ${token}`)
      .set("Accept", "application/json")
      .send(validGenerateBody)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("PROPOSAL_LIMIT_REACHED");
    expect(String(res.body.message)).toMatch(/3 free proposals/i);
  });
});
