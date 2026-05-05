import type { CorsOptions } from "cors";

const LOCAL_DEV = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function parseAllowlist(): string[] {
  const raw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "";
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
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

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    if (LOCAL_DEV.test(origin)) {
      return true;
    }
    if (allowed.length === 0) {
      return true;
    }
  }

  return allowed.includes(origin);
}

/** Browser-facing CORS for HTTP JSON routes. */
export function buildCorsOptions(): CorsOptions {
  return {
    credentials: true,
    origin(origin, callback) {
      callback(null, corsAllowsOrigin(origin));
    },
  };
}
