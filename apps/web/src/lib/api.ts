/**
 * Backend base URL — same origin only works if proxied; default from env targets Express.
 */
export function getApiBase(): string {
  return (typeof process.env.NEXT_PUBLIC_API_URL === "string"
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : ""
  ).trim();
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("token") ??
    localStorage.getItem("authToken") ??
    localStorage.getItem("pa_token");
  if (!token?.trim()) return {};
  return { Authorization: `Bearer ${token.trim()}` };
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
