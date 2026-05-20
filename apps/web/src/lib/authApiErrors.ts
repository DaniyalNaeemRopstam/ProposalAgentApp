import { getApiBase } from "@/lib/api";

/** Parse login/register failure bodies; avoid masking config/network issues as "invalid password". */
export function parseAuthApiError(res: Response, raw: unknown): string {
  if (raw && typeof raw === "object" && "message" in raw) {
    const m = (raw as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }

  const base = getApiBase();
  const contentType = res.headers.get("content-type") ?? "";

  if (!base) {
    return "Sign-in could not reach the API. Set NEXT_PUBLIC_API_URL in Vercel to your Railway URL (e.g. https://proposalagentapp-production.up.railway.app) and redeploy.";
  }

  if (base.includes("your-app.railway.app") || base.includes("your-app.up.railway.app")) {
    return "Sign-in is misconfigured: NEXT_PUBLIC_API_URL is still a placeholder. Set it to your real Railway API URL in Vercel → Environment Variables, then redeploy.";
  }

  if (!contentType.includes("json")) {
    return `Sign-in failed (HTTP ${res.status}). The server did not return JSON — check that NEXT_PUBLIC_API_URL is ${base}.`;
  }

  if (res.status === 401) return "Invalid email or password.";
  return `Sign-in failed (HTTP ${res.status}).`;
}

export function isApiUrlMisconfigured(): boolean {
  const base = getApiBase();
  if (!base) return true;
  return base.includes("your-app.railway.app") || base.includes("your-app.up.railway.app");
}
