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

function parseAllowlist(): { exact: string[]; patterns: string[] } {
  const raw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "";
  const exact: string[] = [];
  const patterns: string[] = [];
  for (const entry of raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)) {
    if (entry.includes("*")) {
      patterns.push(entry);
    } else {
      const n = normalizeOrigin(entry);
      if (n) exact.push(n);
    }
  }
  return { exact, patterns };
}

function originMatchesPattern(origin: string, pattern: string): boolean {
  const normalized = normalizeOrigin(origin);
  const pat = pattern.trim();
  if (!pat.includes("*")) {
    return normalized === normalizeOrigin(pat);
  }
  const escaped = pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i").test(normalized);
}

/**
 * Rule shared by Express (`cors`) and Socket.IO. Missing `Origin` is allowed
 * (native apps, Stripe webhooks tooling, curl, non-browser callers).
 */
export function corsAllowsOrigin(origin: string | undefined): boolean {
  const { exact, patterns } = parseAllowlist();
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    if (LOCAL_DEV.test(origin)) {
      return true;
    }
    if (exact.length === 0 && patterns.length === 0) {
      return true;
    }
  }

  if (exact.includes(normalized)) return true;
  return patterns.some((p) => originMatchesPattern(origin, p));
}

/** Browser-facing CORS for HTTP JSON routes. */
export function buildCorsOptions(): CorsOptions {
  return {
    credentials: true,
    origin(origin, callback) {
      const ok = corsAllowsOrigin(origin);
      if (process.env.LOG_CORS === "1" && origin && !ok) {
        const { exact, patterns } = parseAllowlist();
        console.warn(
          `[cors] rejected Origin="${origin}" (normalized="${normalizeOrigin(origin)}") exact=${JSON.stringify(exact)} patterns=${JSON.stringify(patterns)}`
        );
      }
      callback(null, ok);
    },
  };
}
