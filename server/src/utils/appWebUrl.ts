/**
 * Frontend base URL for links in transactional emails / redirects.
 * Mirrors billingController precedence in dev-safe way (no crash when unset outside prod billing).
 */
export function getAppWebBaseUrl(): string {
  const explicit =
    process.env.APP_WEB_URL?.trim() ||
    process.env.WEB_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();

  return (explicit ?? "http://localhost:3000").replace(/\/$/, "");
}
