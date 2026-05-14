import type { CorsOptions } from "cors";

/** Local dev browser origins (IPv4, IPv6 loopback, localhost). */
const LOCAL_DEV =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|\[::ffff:127\.0\.0\.1\])(:\d+)?$/i;

/** Normalize for comparison (avoids Railway/Vercel mismatches from trailing slashes or stray paths). */
function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function parseAllowlist(): string[] {
  const raw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "";
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter(Boolean);
}

/**
 * Rule shared by Express (`cors`) and Socket.IO. Missing `Origin` is allowed
 * (native apps, Stripe webhooks tooling, curl, non-browser callers).
 */
export function corsAllowsOrigin(origin: string | undefined): boolean {
  const allowed = parseAllowlist();
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    if (LOCAL_DEV.test(origin)) {
      return true;
    }
    if (allowed.length === 0) {
      return true;
    }
  }

  return allowed.includes(normalized);
}

/** Browser-facing CORS for HTTP JSON routes. */
export function buildCorsOptions(): CorsOptions {
  return {
    credentials: true,
    origin(origin, callback) {
      const ok = corsAllowsOrigin(origin);
      if (process.env.LOG_CORS === "1" && origin && !ok) {
        console.warn(
          `[cors] rejected Origin="${origin}" (normalized="${normalizeOrigin(origin)}") allowlist=${JSON.stringify(parseAllowlist())}`
        );
      }
      callback(null, ok);
    },
  };
}
