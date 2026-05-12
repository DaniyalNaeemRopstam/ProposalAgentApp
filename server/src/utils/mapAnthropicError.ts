import { ApiError } from "./ApiError";

/** Best-effort text from `@anthropic-ai/sdk` or raw API error bodies */
function unwrapAnthropicErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const nested = (error as { error?: { message?: unknown } }).error?.message;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return typeof error === "string" ? error : "";
}

/** Map Anthropic client failures to REST `ApiError` (never returns). */
export function rethrowAnthropicAsApiError(error: unknown): never {
  const text = unwrapAnthropicErrorMessage(error) || String(error);

  if (
    /credit balance|too low|purchase credits|plans\s*&\s*billing/i.test(text)
  ) {
    throw new ApiError(
      402,
      "Anthropic rejected this request because your Claude API billing balance is empty or too low. " +
        "Add credits under Console → Plans & billing (console.anthropic.com). " +
        "API usage is billed separately from a consumer Claude subscription."
    );
  }

  if (/rate.?limit/i.test(text)) {
    throw new ApiError(
      429,
      "Claude API rate limit reached. Wait a minute and try again."
    );
  }

  throw new ApiError(
    502,
    text.length <= 280 ? text : `${text.slice(0, 277)}…`
  );
}
