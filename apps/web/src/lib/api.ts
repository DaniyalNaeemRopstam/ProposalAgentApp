import { PA_TOKEN_COOKIE } from "@/lib/auth-cookie";

/** Raw backend URL from env (Railway / local Express). Never the Vercel frontend URL. */
export function getConfiguredApiBackend(): string {
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

function isFrontendHostUrl(base: string): boolean {
  try {
    const h = new URL(base).hostname.toLowerCase();
    return h.endsWith(".vercel.app") || h.endsWith(".netlify.app");
  } catch {
    return false;
  }
}

/**
 * Base URL for browser `fetch` calls.
 * When a remote backend is configured, returns "" so requests hit same-origin `/api/*`
 * and Next.js rewrites proxy to Railway/local Express (avoids CORS).
 */
export function getApiBase(): string {
  const backend = getConfiguredApiBackend();
  if (typeof window !== "undefined" && backend && !isFrontendHostUrl(backend)) {
    return "";
  }
  return backend;
}

/** Direct backend URL — used for Socket.IO (cannot use HTTP rewrites). */
export function getSocketBase(): string {
  const backend = getConfiguredApiBackend();
  if (backend) return backend;
  if (typeof window !== "undefined") return window.location.origin;
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
