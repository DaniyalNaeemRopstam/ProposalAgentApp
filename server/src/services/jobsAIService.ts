import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ??
  "claude-sonnet-4-20250514";

export const jobScoreResultSchema = z.object({
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  shouldApply: z.boolean(),
  redFlags: z.array(z.string()),
});

export type JobScoreResult = z.infer<typeof jobScoreResultSchema>;

export const clientResearchResultSchema = z.object({
  summary: z.string(),
  trustSignals: z.array(z.string()),
  redFlags: z.array(z.string()),
  negotiationTips: z.array(z.string()),
});

export type ClientResearchResult = z.infer<typeof clientResearchResultSchema>;

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new ApiError(503, "Anthropic API is not configured (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

/** Extract JSON from Claude markdown fences or plain text. */
export function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const blob = fence ? fence[1].trim() : trimmed;
  return JSON.parse(blob) as unknown;
}

export async function scoreJobWithClaude(input: {
  userContextBlock: string;
  jobTitle: string;
  jobDescription: string;
  jobBudget: string;
  jobTags: string[];
  clientInfo: Record<string, unknown>;
  competition: string;
  postedRecency: string;
}): Promise<JobScoreResult> {
  const anthropic = getAnthropic();

  const userPayload = `
${input.userContextBlock}

Job to evaluate:
---
Title: ${input.jobTitle}
Budget: ${input.jobBudget}
Tags: ${input.jobTags.join(", ") || "(none)"}
Client: ${JSON.stringify(input.clientInfo)}
Competition (context): ${input.competition}
Posting recency (context): ${input.postedRecency}

Description:
${input.jobDescription}
`.trim();

  const prompt =
    `You are an AI job scoring engine for a senior React Native + MERN developer with 7+ years experience and a US LLC. ` +
    `Score this job 0-100 and return JSON ONLY (no prose, no markdown) with exactly this shape: ` +
    `{"score": number, "reasons": string[], "shouldApply": boolean, "redFlags": string[]}.\n\n` +
    `Factor in:\n` +
    `- Stack match (React Native, React, Node, Mongo/MERN strongly positive)\n` +
    `- Budget fit vs the freelancer's stated typical project budgets\n` +
    `- Client quality (rating, spend history, verification)\n` +
    `- Competition level\n` +
    `- Posting recency (fresher postings should score slightly higher)\n\n` +
    `${userPayload}`;

  const msg = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (block.type !== "text") {
    throw ApiError.badRequest("Unexpected Claude response shape");
  }

  let parsed: unknown;
  try {
    parsed = extractJsonPayload(block.text);
  } catch {
    throw ApiError.badRequest("Claude did not return valid JSON for job scoring.");
  }

  const result = jobScoreResultSchema.safeParse(parsed);
  if (!result.success) {
    throw ApiError.badRequest("Claude scoring JSON failed validation.");
  }

  return result.data;
}

export async function researchClientWithClaude(input: {
  clientName: string;
  country: string;
  platform: string;
  userNotes?: string;
}): Promise<ClientResearchResult> {
  const anthropic = getAnthropic();

  const prompt =
    `You are a research analyst helping a senior React Native + MERN contractor evaluate a prospective client.\n` +
    `Return JSON ONLY (no prose, no markdown) with keys: summary (string), trustSignals (string[]), redFlags (string[]), negotiationTips (string[]).\n` +
    `Be practical and skeptical; infer likely patterns based on typical ${input.platform} client behavior plus the clues given.\n\n` +
    `Client name: ${input.clientName}\n` +
    `Country/region: ${input.country}\n` +
    `Platform: ${input.platform}\n` +
    (input.userNotes ? `Extra context:\n${input.userNotes}` : "");

  const msg = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (block.type !== "text") {
    throw ApiError.badRequest("Unexpected Claude response shape");
  }

  let parsed: unknown;
  try {
    parsed = extractJsonPayload(block.text);
  } catch {
    throw ApiError.badRequest("Claude did not return valid JSON for client research.");
  }

  const result = clientResearchResultSchema.safeParse(parsed);
  if (!result.success) {
    throw ApiError.badRequest("Claude research JSON failed validation.");
  }

  return result.data;
}
