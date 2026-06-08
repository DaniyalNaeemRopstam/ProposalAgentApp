import { ApiError } from "@proposalagent/api-client";
import { getApiBaseUrl } from "./api";
import { PRODUCTION_API_URL } from "../constants/config";

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

export function isApiUrlMisconfigured(): boolean {
  const base = getApiBaseUrl();
  if (!base.trim()) return true;
  if (isLikelyFrontendHostAsApiBase(base)) return true;
  return (
    base.includes("your-app.railway.app") ||
    base.includes("your-app.up.railway.app")
  );
}

export function formatAuthError(
  error: unknown,
  action: "sign-in" | "sign-up" = "sign-in"
): string {
  const base = getApiBaseUrl();
  const label = action === "sign-in" ? "Sign in" : "Sign up";

  if (error instanceof ApiError) {
    if (error.status === 401) return "Invalid email or password.";
    if (error.message.trim()) return error.message.trim();
    return `${label} failed (HTTP ${error.status}).`;
  }

  if (isApiUrlMisconfigured()) {
    return `EXPO_PUBLIC_API_URL is misconfigured (${base}). Set it to your Railway API URL (e.g. ${PRODUCTION_API_URL}) in apps/mobile/.env and restart Expo.`;
  }

  if (error instanceof SyntaxError) {
    return `${label} could not parse the API response. Confirm EXPO_PUBLIC_API_URL points at your Railway backend (${PRODUCTION_API_URL}), not a frontend URL. Current: ${base}`;
  }

  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network request failed") || msg.includes("failed to fetch")) {
      if (base.includes("localhost") || base.includes("127.0.0.1") || base.includes("10.0.2.2")) {
        return `${label} cannot reach localhost from this device. Copy apps/mobile/.env.example to .env with EXPO_PUBLIC_API_URL=${PRODUCTION_API_URL} and restart Expo with -c.`;
      }
      return `${label} cannot reach the API at ${base}. Check your network connection.`;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return `${label} failed. Please try again.`;
}
