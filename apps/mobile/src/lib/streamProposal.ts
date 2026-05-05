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
