import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";
import { rethrowAnthropicAsApiError } from "../utils/mapAnthropicError";
import { extractJsonPayload } from "./jobsAIService";

const PROPOSAL_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
const SCORE_MODEL = process.env.ANTHROPIC_SCORE_MODEL ?? "claude-haiku-4-20250307";

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new ApiError(503, "Anthropic API key is not configured (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProposalVariant = "quality" | "price" | "speed";
export type ProposalMode = "upwork" | "linkedin" | "email";

export type UserProfile = {
  name: string;
  companyName: string;
  voiceProfile?: string | null;
  plan?: string;
  projectLibrary?: Array<{
    title: string;
    client: string;
    outcome: string;
    stack?: string[];
    budget: string;
  }>;
};

export type GenerateProposalInput = {
  jobTitle: string;
  jobDescription: string;
  jobBudget: string;
  platform: string;
  clientName: string;
  clientCountry: string;
  tags: string[];
  mode: ProposalMode;
  variant: ProposalVariant;
  user: UserProfile;
};

export type GenerateProposalResult = {
  content: string;
  wordCount: number;
  replyProbability: number;
  proposalScore: number;
};

const proposalQualitySchema = z.object({
  proposalScore: z.number().min(0).max(100),
  replyProbability: z.number().min(0).max(100),
  feedback: z.array(z.string()).default([]),
});

// ─── Variant instructions ─────────────────────────────────────────────────────

const VARIANT_INSTRUCTIONS: Record<ProposalVariant, string> = {
  quality:
    "Emphasise technical excellence, past results, and craftsmanship. " +
    "Show deep understanding of the client's real problem. " +
    "Do NOT compete on price — position at the upper end of their budget.",
  price:
    "Lead with competitive pricing. State a specific price that undercuts typical rates " +
    "while still being above $3k minimum. Show you can deliver fast and lean.",
  speed:
    "Lead with your ability to start immediately and deliver in the shortest realistic timeline. " +
    "Stress that you have done this exact type of project before. " +
    "Propose milestone 1 delivery within 1–2 weeks.",
};

const MODE_SIGNATURE: Record<ProposalMode, string> = {
  upwork:
    "Format this as an Upwork proposal: plain text, direct, no fluff. " +
    "First line is the hook, then short body, then CTA.",
  linkedin:
    "Format this as a LinkedIn DM: conversational, slightly warmer tone, " +
    "max 5 short paragraphs, end with a soft question rather than a hard CTA.",
  email:
    "Format this as a cold outreach email: include a subject line on the first line " +
    "prefixed with 'Subject:', professional but personable, max 250 words body.",
};

function formatVoiceProfileForPrompt(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const lines: string[] = [];
    if (typeof parsed.openingStyle === "string") lines.push(`Opening style: ${parsed.openingStyle}`);
    if (typeof parsed.tone === "string") lines.push(`Tone: ${parsed.tone}`);
    if (Array.isArray(parsed.commonPhrases)) {
      lines.push(`Common phrases: ${parsed.commonPhrases.join("; ")}`);
    }
    if (Array.isArray(parsed.avoidedPhrases)) {
      lines.push(`Avoid: ${parsed.avoidedPhrases.join("; ")}`);
    }
    if (typeof parsed.closingStyle === "string") lines.push(`Closing style: ${parsed.closingStyle}`);
    if (Array.isArray(parsed.uniqueQualities)) {
      lines.push(`Unique qualities: ${parsed.uniqueQualities.join("; ")}`);
    }
    if (lines.length) return lines.join("\n").slice(0, 3000);
  } catch {
    /* raw text fallback */
  }
  return `${trimmed.slice(0, 3000)}${trimmed.length > 3000 ? "\n[...truncated...]" : ""}`;
}

// ─── Project library formatter ────────────────────────────────────────────────

function formatProjectLibrary(
  library?: UserProfile["projectLibrary"],
  tags?: string[]
): string {
  if (!library?.length) {
    return "(No past projects on file — write generally about seniority and stack.)";
  }

  const tagSet = new Set((tags ?? []).map((t) => t.toLowerCase()));

  // Prefer projects whose stack overlaps with the job tags
  const ranked = [...library].sort((a, b) => {
    const aRelevance = (a.stack ?? []).filter((s) => tagSet.has(s.toLowerCase())).length;
    const bRelevance = (b.stack ?? []).filter((s) => tagSet.has(s.toLowerCase())).length;
    return bRelevance - aRelevance;
  });

  return ranked
    .slice(0, 3) // top 3 most relevant
    .map(
      (p) =>
        `• ${p.title} — client: ${p.client}, outcome: ${p.outcome}, ` +
        `stack: ${p.stack?.join(", ") || "—"}, budget: ${p.budget}`
    )
    .join("\n");
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildProposalPrompt(input: GenerateProposalInput): string {
  const { user, mode, variant } = input;

  const projectSection = formatProjectLibrary(user.projectLibrary, input.tags);

  const voiceSection = user.voiceProfile
    ? `\nYour writing style (extracted from past winning proposals — replicate this voice):\n"""\n${formatVoiceProfileForPrompt(user.voiceProfile)}\n"""`
    : "";

  return `You are ${user.name}, founder of ${user.companyName}, a senior React Native & MERN stack developer with 7+ years of experience and a US LLC.

IDENTITY & CREDENTIALS
- US LLC: ${user.companyName} (professional contracts, USD invoicing)
- Stack expertise: React Native, React, Node.js, Express, MongoDB, AWS, Firebase
- Notable past work highlighted below — reference whichever is most relevant to THIS job${voiceSection}

PAST PROJECTS (pick the single most relevant one to mention):
${projectSection}

JOB DETAILS
Title: ${input.jobTitle}
Platform: ${input.platform}
Budget: ${input.jobBudget}
Client: ${input.clientName} — ${input.clientCountry}
Tags: ${input.tags.join(", ") || "(none)"}
Description:
${input.jobDescription}

VARIANT STRATEGY — ${variant.toUpperCase()}
${VARIANT_INSTRUCTIONS[variant]}

FORMAT RULES — ${mode.toUpperCase()}
${MODE_SIGNATURE[mode]}

UNIVERSAL RULES
- Open with a HOOK that references something SPECIFIC from their job description (NEVER start with "Dear Sir" or "I am writing to apply")
- Demonstrate you understand their real underlying problem, not just the listed requirements
- Mention exactly ONE relevant past project with a concrete outcome (user count, revenue, timeline)
- Include a 3-milestone payment structure (brief, inline)
- End with a low-commitment CTA: offer a 15-minute call or a quick question
- Keep total word count under 200 words
- Sound like a confident senior developer — NOT desperate or generic
- Suggest a specific price that fits within their stated budget range
- Never use bullet points in the proposal body itself — write in natural paragraphs

Write the proposal now. No preamble. No "Here is the proposal:". Just the proposal text itself.`.trim();
}

// ─── Quality scoring prompt ───────────────────────────────────────────────────

function buildScoringPrompt(proposal: string, jobTitle: string): string {
  return `You are a freelance proposal quality auditor. Evaluate the following proposal for the job "${jobTitle}".

Return JSON ONLY (no prose, no markdown) with exactly this shape:
{"proposalScore": number, "replyProbability": number, "feedback": string[]}

Scoring guide:
- proposalScore (0–100): grammar, specificity, confidence, relevance, personalisation
- replyProbability (0–100): realistic chance this gets a reply or shortlist based on hook quality and CTA
- feedback: 2–4 short improvement suggestions (empty array if score >= 85)

PROPOSAL:
"""
${proposal}
"""`.trim();
}

async function scoreProposalQuality(
  anthropic: Anthropic,
  content: string,
  jobTitle: string
): Promise<{ proposalScore: number; replyProbability: number }> {
  let replyProbability = 65;
  let proposalScore = 70;

  try {
    const scoreMsg = await anthropic.messages.create({
      model: SCORE_MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: buildScoringPrompt(content, jobTitle) }],
    });

    const scoreBlock = scoreMsg.content[0];
    if (scoreBlock.type === "text") {
      const parsed = extractJsonPayload(scoreBlock.text);
      const validated = proposalQualitySchema.safeParse(parsed);
      if (validated.success) {
        proposalScore = Math.round(validated.data.proposalScore);
        replyProbability = Math.round(validated.data.replyProbability);
      }
    }
  } catch {
    // Non-fatal: use default scores if scoring call fails
  }

  return { proposalScore, replyProbability };
}

// ─── Main generation function ─────────────────────────────────────────────────

export async function generateProposal(
  input: GenerateProposalInput
): Promise<GenerateProposalResult> {
  const anthropic = getAnthropic();

  let proposalMsg;
  try {
    proposalMsg = await anthropic.messages.create({
      model: PROPOSAL_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: buildProposalPrompt(input) }],
    });
  } catch (err) {
    rethrowAnthropicAsApiError(err);
  }

  const proposalBlock = proposalMsg.content[0];
  if (proposalBlock.type !== "text") {
    throw new ApiError(502, "Claude returned an unexpected content type for proposal generation.");
  }

  const content = proposalBlock.text.trim();
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const { replyProbability, proposalScore } = await scoreProposalQuality(
    anthropic,
    content,
    input.jobTitle
  );

  return { content, wordCount, replyProbability, proposalScore };
}

// ─── Streaming generation (Claude messages.stream) ───────────────────────────

export async function generateProposalStreaming(
  input: GenerateProposalInput,
  onTextDelta: (delta: string) => void
): Promise<GenerateProposalResult> {
  const anthropic = getAnthropic();

  let content: string;
  try {
    const stream = anthropic.messages.stream({
      model: PROPOSAL_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: buildProposalPrompt(input) }],
    });

    stream.on("text", (delta) => {
      onTextDelta(delta);
    });

    content = (await stream.finalText()).trim();
  } catch (err) {
    rethrowAnthropicAsApiError(err);
  }
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const { replyProbability, proposalScore } = await scoreProposalQuality(
    anthropic,
    content,
    input.jobTitle
  );

  return { content, wordCount, replyProbability, proposalScore };
}
