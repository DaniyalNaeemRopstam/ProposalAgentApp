import { PA_TOKEN_COOKIE } from "@/lib/auth-cookie";
import {
  getConfiguredApiBackend,
  PRODUCTION_API_BACKEND,
} from "@/lib/apiBackend";

export { getConfiguredApiBackend, PRODUCTION_API_BACKEND } from "@/lib/apiBackend";

/**
 * Base URL for browser `fetch` calls — always same-origin `/api/*` so the Next.js
 * route handler proxies to Railway/local Express (no CORS).
 */
export function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  return getConfiguredApiBackend();
}

/** Direct backend URL — used for Socket.IO (cannot use HTTP proxy). */
export function getSocketBase(): string {
  return getConfiguredApiBackend();
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

function readBearerFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${PA_TOKEN_COOKIE}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length)).trim();
      } catch {
        return part.slice(prefix.length).trim();
      }
    }
  }
  return undefined;
}

export function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("pa_token")?.trim() ??
    localStorage.getItem("token")?.trim() ??
    localStorage.getItem("authToken")?.trim() ??
    readBearerFromCookie()?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function parseEnvelope<T>(json: unknown): T {
  if (
    json &&
    typeof json === "object" &&
    "success" in json &&
    (json as { success: unknown }).success === true &&
    "data" in json
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}
