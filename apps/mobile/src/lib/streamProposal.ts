import { apiUrl, getAuthHeaders } from "./api";

export type StreamGenerateResult = {
  proposalId: string | null;
  replyProbability: number;
  proposalScore: number | null;
  content: string;
};

/** SSE stream from POST /api/proposals/generate (Accept: text/event-stream). */
export async function generateProposalStream(
  body: Record<string, unknown>,
  onChunk: (text: string) => void
): Promise<StreamGenerateResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/proposals/generate"), {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = "Proposal generation failed.";
    try {
      const json = JSON.parse(raw) as { message?: string };
      if (typeof json.message === "string" && json.message.trim()) msg = json.message;
    } catch {
      if (raw.trim()) msg = raw.trim();
    }
    throw new Error(msg);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Streaming is not available on this device.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let proposalId: string | null = null;
  let replyProbability = 68;
  let proposalScore: number | null = null;

  const flush = (raw: string): string => {
    const blocks = raw.split("\n\n");
    const incomplete = blocks.pop() ?? "";
    for (const block of blocks) {
      const line = block.trim();
      if (!line.startsWith("data:")) continue;
      let ev: Record<string, unknown>;
      try {
        ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (typeof ev.chunk === "string" && ev.chunk.length > 0) {
        content += ev.chunk;
        onChunk(content);
      }
      if (ev.done === true) {
        if (typeof ev.proposalId === "string") proposalId = ev.proposalId;
        if (typeof ev.replyProbability === "number") replyProbability = ev.replyProbability;
        if (typeof ev.proposalScore === "number") proposalScore = Math.round(ev.proposalScore);
      }
      if (typeof ev.error === "string" && ev.error.trim()) {
        throw new Error(ev.error.trim());
      }
    }
    return incomplete;
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      flush(`${buffer}\n\n`);
      break;
    }
    buffer = flush(buffer + decoder.decode(value, { stream: true }));
  }

  return { proposalId, replyProbability, proposalScore, content };
}

/** Word-by-word reveal for a native-style streaming UX (matches web behavior). */
export async function streamProposalContent(
  fullText: string,
  onUpdate: (text: string) => void,
  wordDelayMs = 14
): Promise<void> {
  const pieces = fullText.match(/\S+\s*/g) ?? [fullText];
  let acc = "";
  for (const chunk of pieces) {
    acc += chunk;
    onUpdate(acc);
    await new Promise<void>((resolve) => setTimeout(resolve, wordDelayMs));
  }
}
