/** Client-only: sync `pa_token` for Next.js middleware (same value as localStorage). */
export const PA_TOKEN_COOKIE = "pa_token";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30d, matches server JWT default

export function setPaTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:"
      ? "; Secure"
      : "";
  const enc = encodeURIComponent(token);
  document.cookie = `${PA_TOKEN_COOKIE}=${enc}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearPaTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PA_TOKEN_COOKIE}=; path=/; max-age=0`;
}
