// import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ApiError } from "../utils/ApiError";
// import { rethrowAnthropicAsApiError } from "../utils/mapAnthropicError";

export type LlmProvider = "openai" | "anthropic";

/** OpenAI for testing; set AI_PROVIDER=anthropic and uncomment Claude blocks to switch back. */
export function resolveLlmProvider(): LlmProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic") {
    throw new ApiError(
      503,
      "Claude provider is commented out for testing. Set AI_PROVIDER=openai or uncomment Claude code in llmClient.ts."
    );
  }
  return "openai";
  // --- Claude (restore when switching back) ---
  // if (explicit === "openai" || explicit === "anthropic") return explicit;
  // if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  // return "anthropic";
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new ApiError(503, "OpenAI API key is not configured (OPENAI_API_KEY).");
  }
  return new OpenAI({ apiKey });
}

// --- Claude client (commented out for OpenAI testing) ---
// function getAnthropic(): Anthropic {
//   const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
//   if (!apiKey) {
//     throw new ApiError(503, "Anthropic API key is not configured (ANTHROPIC_API_KEY).");
//   }
//   return new Anthropic({ apiKey });
// }

function rethrowOpenAiAsApiError(error: unknown): never {
  const text =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  if (/insufficient_quota|billing|exceeded your current quota/i.test(text)) {
    throw new ApiError(
      402,
      "OpenAI rejected this request due to billing or quota limits. Check platform.openai.com → Billing."
    );
  }
  if (/rate.?limit/i.test(text)) {
    throw new ApiError(429, "OpenAI rate limit reached. Wait a minute and try again.");
  }
  throw new ApiError(502, text.length <= 280 ? text : `${text.slice(0, 277)}…`);
}

// function rethrowLlmError(error: unknown, provider: LlmProvider): never {
//   if (provider === "openai") rethrowOpenAiAsApiError(error);
//   rethrowAnthropicAsApiError(error);
// }

export async function llmCompleteText(opts: {
  model: string;
  maxTokens: number;
  prompt: string;
}): Promise<string> {
  try {
    const client = getOpenAI();
    const res = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      messages: [{ role: "user", content: opts.prompt }],
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new ApiError(502, "OpenAI returned an empty response.");
    }
    return text;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    rethrowOpenAiAsApiError(err);
  }

  // --- Claude non-streaming (commented out) ---
  // const provider = resolveLlmProvider();
  // try {
  //   if (provider === "openai") { ... OpenAI block above ... }
  //   const anthropic = getAnthropic();
  //   const msg = await anthropic.messages.create({
  //     model: opts.model,
  //     max_tokens: opts.maxTokens,
  //     messages: [{ role: "user", content: opts.prompt }],
  //   });
  //   const block = msg.content[0];
  //   if (block.type !== "text" || !block.text.trim()) {
  //     throw new ApiError(502, "Claude returned an empty response.");
  //   }
  //   return block.text.trim();
  // } catch (err) {
  //   if (err instanceof ApiError) throw err;
  //   rethrowLlmError(err, provider);
  // }
}

export async function llmStreamText(opts: {
  model: string;
  maxTokens: number;
  prompt: string;
  onDelta: (delta: string) => void;
}): Promise<string> {
  try {
    const client = getOpenAI();
    const stream = await client.chat.completions.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      messages: [{ role: "user", content: opts.prompt }],
      stream: true,
    });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        full += delta;
        opts.onDelta(delta);
      }
    }
    return full.trim();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    rethrowOpenAiAsApiError(err);
  }

  // --- Claude streaming (commented out) ---
  // const provider = resolveLlmProvider();
  // try {
  //   if (provider === "openai") { ... OpenAI block above ... }
  //   const anthropic = getAnthropic();
  //   const stream = anthropic.messages.stream({
  //     model: opts.model,
  //     max_tokens: opts.maxTokens,
  //     messages: [{ role: "user", content: opts.prompt }],
  //   });
  //   stream.on("text", (delta) => opts.onDelta(delta));
  //   return (await stream.finalText()).trim();
  // } catch (err) {
  //   if (err instanceof ApiError) throw err;
  //   rethrowLlmError(err, provider);
  // }
}

export function resolveProposalModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  // Claude: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
}

export function resolveScoreModel(): string {
  return process.env.OPENAI_SCORE_MODEL?.trim() || "gpt-4o-mini";
  // Claude: process.env.ANTHROPIC_SCORE_MODEL?.trim() || "claude-haiku-4-20250307";
}
