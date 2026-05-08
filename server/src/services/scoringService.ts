import Anthropic from "@anthropic-ai/sdk";
import { ApiError } from "../utils/ApiError";

const HAIKU_MODEL = "claude-haiku-4-20250514";

interface ScoredJob {
  score: number;
  reasons: string[];
  shouldApply?: boolean;
  redFlags?: string[];
}

interface JobToScore {
  title: string;
  budget: string;
  tags?: string[];
  snippet: string;
  platform: string;
  client?: {
    name: string;
    verified?: boolean;
  };
}

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new ApiError(503, "Anthropic API is not configured (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(array.length / size) },
    (_, i) => array.slice(i * size, i * size + size)
  );
}

/**
 * Extract JSON from Claude response (handle markdown fences)
 */
function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const blob = fence ? fence[1].trim() : trimmed;
  return JSON.parse(blob) as unknown;
}

/**
 * Batch score jobs using Claude Haiku for cost efficiency.
 * Processes jobs in chunks of 10 to stay within token limits.
 * Uses a simplified prompt focused on key scoring criteria.
 */
export async function batchScoreJobs(jobs: JobToScore[]): Promise<ScoredJob[]> {
  if (jobs.length === 0) return [];

  const anthropic = getAnthropic();
  const chunks = chunkArray(jobs, 10);
  const results: ScoredJob[] = [];

  for (const chunk of chunks) {
    const prompt = `Score these ${chunk.length} freelance jobs for a senior developer profile:

Profile:
- 7+ years React Native & MERN stack experience
- US LLC (DanielForge Technologies)
- Past projects: government apps (100k+ users), hotel booking systems, startup MVPs
- Looking for: $5k-$50k projects, remote worldwide, quality clients

Scoring criteria (0-100):
- Stack match (React Native/MERN/React/Node.js mentioned): +30pts
- Budget range $5k-$50k: +25pts
- Remote friendly: +20pts
- Client quality signals (verified, good rating, spend history): +15pts
- Recency (posted today/this week): +10pts

Return ONLY this JSON array format, nothing else:
[{"index":0,"score":85,"reasons":["Strong stack match","Budget in range"],"shouldApply":true},...]

Jobs to score:
${chunk
  .map(
    (j, i) =>
      `${i}. "${j.title}" | ${j.platform} | Budget: ${j.budget} | Tags: ${j.tags?.join(",") || "none"} | Client: ${j.client?.name || "Unknown"}${j.client?.verified ? " (verified)" : ""} | "${j.snippet.slice(0, 100)}..."`
  )
  .join("\n")}`;

    try {
      const response = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const block = response.content[0];
      if (block.type !== "text") {
        throw new Error("Unexpected Claude response type");
      }

      const scores = extractJsonPayload(block.text) as Array<{
        index: number;
        score: number;
        reasons: string[];
        shouldApply?: boolean;
      }>;

      // Map scores back to jobs
      chunk.forEach((_, i) => {
        const scoreData = scores[i];
        results.push({
          score: scoreData?.score ?? 65,
          reasons: scoreData?.reasons ?? ["Potential match for your stack"],
          shouldApply: scoreData?.shouldApply ?? scoreData?.score > 75,
          redFlags: [],
        });
      });
    } catch (error) {
      console.error(`Error scoring chunk:`, error);
      // Fallback: assign default scores
      chunk.forEach(() => {
        results.push({
          score: 65,
          reasons: ["Auto-scored (scoring service unavailable)"],
          shouldApply: false,
          redFlags: [],
        });
      });
    }

    // Rate limit: wait 500ms between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Score a single job (for real-time use)
 */
export async function scoreSingleJob(job: JobToScore): Promise<ScoredJob> {
  const results = await batchScoreJobs([job]);
  return results[0];
}
