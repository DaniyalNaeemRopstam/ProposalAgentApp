import { getConfiguredApiBackend } from "@/lib/api";

/**
 * NEXT_PUBLIC_API_URL must be the **backend** (e.g. Railway), not the Next.js site.
 * Using the Vercel app URL causes 404 HTML on /api/auth/*.
 */
export function isLikelyFrontendHostAsApiBase(base: string): boolean {
  if (!base.trim()) return false;
  try {
    const h = new URL(base).hostname.toLowerCase();
    if (h.endsWith(".vercel.app")) return true;
    if (h.endsWith(".netlify.app")) return true;
    return false;
  } catch {
    return false;
  }
}

const RAILWAY_EXAMPLE = "https://proposalagentapp-production.up.railway.app";

/** Parse login/register failure bodies; avoid masking config/network issues as "invalid password". */
export function parseAuthApiError(res: Response, raw: unknown): string {
  if (raw && typeof raw === "object" && "message" in raw) {
    const m = (raw as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }

  const base = getConfiguredApiBackend();
  const contentType = res.headers.get("content-type") ?? "";

  if (!base) {
    return `Sign-up could not reach the API. In Vercel → Environment Variables set NEXT_PUBLIC_API_URL to your Railway API base (e.g. ${RAILWAY_EXAMPLE}), not your Vercel site URL. Then redeploy.`;
  }

  if (isLikelyFrontendHostAsApiBase(base)) {
    return `NEXT_PUBLIC_API_URL is set to your frontend (${base}). It must be your **Railway API URL** (e.g. ${RAILWAY_EXAMPLE}) — the server that serves /api/auth/register. Update it in Vercel → Environment Variables and redeploy.`;
  }

  if (base.includes("your-app.railway.app") || base.includes("your-app.up.railway.app")) {
    return "Sign-in is misconfigured: NEXT_PUBLIC_API_URL is still a placeholder. Set it to your real Railway API URL in Vercel → Environment Variables, then redeploy.";
  }

  if (!contentType.includes("json")) {
    return `Request failed (HTTP ${res.status}) — the URL is not returning JSON. Confirm NEXT_PUBLIC_API_URL in Vercel points at your **Railway backend** (${RAILWAY_EXAMPLE}), not this Vercel domain, then redeploy.`;
  }

  if (res.status === 401) return "Invalid email or password.";
  return `Sign-in failed (HTTP ${res.status}).`;
}

export function isApiUrlMisconfigured(): boolean {
  const base = getConfiguredApiBackend();
  if (!base) return true;
  if (isLikelyFrontendHostAsApiBase(base)) return true;
  return base.includes("your-app.railway.app") || base.includes("your-app.up.railway.app");
}
