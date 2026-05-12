import { PA_TOKEN_COOKIE } from "@/lib/auth-cookie";

/**
 * Backend base URL — same origin only works if proxied; default from env targets Express.
 * In development, defaults to http://127.0.0.1:5000 so sign-in works when env lives only at
 * the monorepo root (Next reads apps/web/.env*, not ../../.env).
 */
export function getApiBase(): string {
  const fromEnv = (
    typeof process.env.NEXT_PUBLIC_API_URL === "string"
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
      : ""
  ).trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:5000";
  }
  return "";
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
