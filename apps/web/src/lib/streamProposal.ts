/**
 * Word-by-word reveal using ReadableStream over pre-computed AI text,
 * mirroring streaming UX without server-side chunked responses.
 */
export async function streamProposalContent(
  fullText: string,
  onUpdate: (text: string) => void,
  wordDelayMs = 14
): Promise<void> {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const pieces = fullText.match(/\S+\s*/g) ?? [fullText];
        let acc = "";
        for (const chunk of pieces) {
          acc += chunk;
          controller.enqueue(new TextEncoder().encode(acc));
          await new Promise<void>((resolve) => setTimeout(resolve, wordDelayMs));
        }
        controller.close();
      } catch (e) {
        controller.error(e instanceof Error ? e : new Error(String(e)));
      }
    },
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        onUpdate(decoder.decode(value, { stream: false }));
      }
    }
  } finally {
    reader.releaseLock();
  }
}
