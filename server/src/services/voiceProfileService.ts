import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ApiError } from "../utils/ApiError";
import { extractJsonPayload } from "./jobsAIService";

const VOICE_MODEL = process.env.ANTHROPIC_SCORE_MODEL ?? "claude-haiku-4-20250514";

const voiceProfileSchema = z.object({
  openingStyle: z.string(),
  tone: z.string(),
  commonPhrases: z.array(z.string()),
  avoidedPhrases: z.array(z.string()),
  closingStyle: z.string(),
  uniqueQualities: z.array(z.string()),
});

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new ApiError(503, "Anthropic API key is not configured (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

/**
 * Analyze pasted winning proposals and return a JSON voice profile string for storage.
 * Falls back to joined raw samples if Claude is unavailable.
 */
export async function analyzeVoiceFromSamples(samples: string[]): Promise<string> {
  const trimmed = samples.map((s) => s.trim()).filter(Boolean);
  if (!trimmed.length) {
    throw ApiError.badRequest("Provide at least one sample proposal.");
  }

  const fallback = trimmed.join("\n---\n");

  try {
    const anthropic = getAnthropic();
    const combined = trimmed
      .map((s, i) => `--- Sample ${i + 1} ---\n${s}`)
      .join("\n\n");

    const msg = await anthropic.messages.create({
      model: VOICE_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content:
            `Extract writing voice characteristics from these freelance proposals and return JSON ONLY ` +
            `(no markdown, no prose) with exactly this shape:\n` +
            `{"openingStyle": string, "tone": string, "commonPhrases": string[], ` +
            `"avoidedPhrases": string[], "closingStyle": string, "uniqueQualities": string[]}\n\n` +
            `Proposals:\n${combined}`,
        },
      ],
    });

    const block = msg.content[0];
    if (block.type !== "text") return fallback;

    const parsed = extractJsonPayload(block.text);
    const validated = voiceProfileSchema.safeParse(parsed);
    if (!validated.success) return fallback;

    return JSON.stringify(validated.data, null, 2);
  } catch (err) {
    console.warn(
      "[voiceProfile] Claude analysis failed; storing raw samples:",
      err instanceof Error ? err.message : err
    );
    return fallback;
  }
}
