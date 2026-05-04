import Anthropic from "@anthropic-ai/sdk";
import { ApiError } from "../utils/ApiError";

const FOLLOW_UP_MODEL = process.env.ANTHROPIC_SCORE_MODEL ?? "claude-haiku-4-20250307";

export type FollowUpDay = 3 | 7 | 14;

export type FollowUpMessageContent = {
  day: FollowUpDay;
  content: string;
};

export type GenerateFollowUpsInput = {
  jobTitle: string;
  platform: string;
  proposalSnippet: string; // first 400 chars of original proposal
  clientName?: string;
  userCompanyName: string;
  userName: string;
};

// ─── Prompt builders ──────────────────────────────────────────────────────────

const DAY_PROMPTS: Record<FollowUpDay, (ctx: GenerateFollowUpsInput) => string> = {
  3: (ctx) =>
    `You are ${ctx.userName} from ${ctx.userCompanyName}. ` +
    `You sent a freelance proposal for "${ctx.jobTitle}" on ${ctx.platform} 3 days ago. ` +
    `Original proposal opening: "${ctx.proposalSnippet.slice(0, 200)}..." ` +
    `\n\nWrite a brief 80-word follow-up message. ` +
    `Tone: casual check-in, add a tiny piece of genuine value (a relevant tip, observation, or quick question specific to their industry). ` +
    `Do NOT beg or sound desperate. ` +
    `End with: "Worth a quick chat?" ` +
    `Write only the message body, no subject line, no greeting.`,

  7: (ctx) =>
    `You are ${ctx.userName} from ${ctx.userCompanyName}. ` +
    `You are following up on a proposal for "${ctx.jobTitle}" for the second time (Day 7). ` +
    `\n\nWrite a 60-word follow-up. ` +
    `Take a completely different angle from your first follow-up — do NOT repeat the same points. ` +
    `Share one sentence about a concrete case study result relevant to their type of project (e.g. timeline saved, users served, revenue generated). ` +
    `End with a direct question asking if they've moved forward or chosen someone else. ` +
    `Write only the message body.`,

  14: (ctx) =>
    `You are ${ctx.userName} from ${ctx.userCompanyName}. ` +
    `This is your final follow-up for "${ctx.jobTitle}" (Day 14). ` +
    `\n\nWrite a 50-word professional close. ` +
    `Assume they've probably found someone or moved on — acknowledge that gracefully. ` +
    `Leave the door open for future work without sounding needy. ` +
    `Do not pitch again. Do not beg. ` +
    `Write only the message body.`,
};

// ─── Claude call ──────────────────────────────────────────────────────────────

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    throw new ApiError(503, "Anthropic API key is not configured (ANTHROPIC_API_KEY).");
  }
  return new Anthropic({ apiKey });
}

async function generateSingleFollowUp(
  day: FollowUpDay,
  ctx: GenerateFollowUpsInput
): Promise<string> {
  const anthropic = getAnthropic();
  const prompt = DAY_PROMPTS[day](ctx);

  const msg = await anthropic.messages.create({
    model: FOLLOW_UP_MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const block = msg.content[0];
  if (block.type !== "text") {
    throw new ApiError(502, `Claude returned unexpected content for Day ${day} follow-up.`);
  }

  return block.text.trim();
}

/** Generate all 3 follow-up message bodies in parallel. */
export async function generateFollowUpMessages(
  ctx: GenerateFollowUpsInput
): Promise<FollowUpMessageContent[]> {
  const days: FollowUpDay[] = [3, 7, 14];

  const results = await Promise.allSettled(
    days.map((day) => generateSingleFollowUp(day, ctx))
  );

  return days.map((day, i) => {
    const result = results[i];
    return {
      day,
      content:
        result.status === "fulfilled"
          ? result.value
          : `[Follow-up ${day} could not be generated — edit before sending.]`,
    };
  });
}

/** Calculate the absolute UTC date for a follow-up given the proposal sent date. */
export function scheduledDate(sentAt: Date, offsetDays: number): Date {
  const d = new Date(sentAt);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  d.setUTCHours(9, 0, 0, 0); // 09:00 UTC — morning send
  return d;
}
