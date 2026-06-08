import {
  getConfiguredApiBackend,
  isFrontendHostUrl,
  PRODUCTION_API_BACKEND,
} from "@/lib/apiBackend";

/** Parse login/register failure bodies. */
export function parseAuthApiError(res: Response, raw: unknown): string {
  if (raw && typeof raw === "object" && "message" in raw) {
    const m = (raw as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }

  const base = getConfiguredApiBackend();
  const contentType = res.headers.get("content-type") ?? "";

  if (isFrontendHostUrl(base)) {
    return `NEXT_PUBLIC_API_URL is set to your frontend (${base}). Remove it or set it to your Railway API URL (e.g. ${PRODUCTION_API_BACKEND}) in Vercel → Environment Variables, then redeploy.`;
  }

  if (
    base.includes("your-app.railway.app") ||
    base.includes("your-app.up.railway.app")
  ) {
    return "NEXT_PUBLIC_API_URL is still a placeholder. Set it to your real Railway API URL in Vercel → Environment Variables, then redeploy.";
  }

  if (!contentType.includes("json")) {
    if (res.status === 404) {
      return `Sign-up could not reach the API (404). Redeploy the latest web app — it proxies /api/* to Railway (${PRODUCTION_API_BACKEND}). If this persists, confirm Railway is running.`;
    }
    return `Request failed (HTTP ${res.status}) — expected JSON from the API at ${base}.`;
  }

  if (res.status === 401) return "Invalid email or password.";
  return `Sign-in failed (HTTP ${res.status}).`;
}

export function isApiUrlMisconfigured(): boolean {
  const envRaw =
    typeof process.env.NEXT_PUBLIC_API_URL === "string"
      ? process.env.NEXT_PUBLIC_API_URL.trim()
      : "";
  if (!envRaw) return false;
  if (isFrontendHostUrl(envRaw)) return true;
  return (
    envRaw.includes("your-app.railway.app") ||
    envRaw.includes("your-app.up.railway.app")
  );
}
