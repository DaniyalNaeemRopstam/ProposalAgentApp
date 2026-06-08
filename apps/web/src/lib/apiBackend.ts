/** Production Railway API — used when env is missing or points at the Vercel frontend. */
export const PRODUCTION_API_BACKEND =
  "https://proposalagentapp-production.up.railway.app";

export function isFrontendHostUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.endsWith(".vercel.app") || h.endsWith(".netlify.app");
  } catch {
    return false;
  }
}

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/**
 * Resolve backend origin for server-side proxy (route handler, rewrites).
 * Ignores NEXT_PUBLIC values that point at the frontend host.
 */
export function resolveApiBackendUrl(): string {
  const candidates = [
    process.env.API_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ];
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const base = normalizeBase(raw);
    if (base && !isFrontendHostUrl(base)) return base;
  }
  if (process.env.NODE_ENV === "development") return "http://127.0.0.1:5000";
  return PRODUCTION_API_BACKEND;
}

/** Client + shared — baked at build time; falls back in production. */
export function getConfiguredApiBackend(): string {
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_API_URL === "string"
      ? normalizeBase(process.env.NEXT_PUBLIC_API_URL)
      : "";
  if (fromEnv && !isFrontendHostUrl(fromEnv)) return fromEnv;
  if (process.env.NODE_ENV === "development") return "http://127.0.0.1:5000";
  return PRODUCTION_API_BACKEND;
}
