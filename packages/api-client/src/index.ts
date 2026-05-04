import type { User } from "@proposalagent/shared";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  method?: HttpMethod;
  body?: unknown;
};

type ApiEnvelope<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: unknown };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const { body, method = "GET", headers, ...rest } = options;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers as Record<string, string>),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...rest,
    });

    const text = await res.text();
    const parsed = text ? (JSON.parse(text) as unknown) : undefined;

    if (!res.ok) {
      const msg =
        parsed &&
        typeof parsed === "object" &&
        "message" in parsed &&
        typeof (parsed as { message: unknown }).message === "string"
          ? (parsed as { message: string }).message
          : res.statusText || "Request failed";
      throw new ApiError(msg, res.status, parsed);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as ApiEnvelope<T>).success === false
    ) {
      const env = parsed as ApiEnvelope<T>;
      throw new ApiError(env.message || "Request failed", res.status, env);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "success" in parsed &&
      (parsed as ApiEnvelope<T>).success === true &&
      "data" in parsed
    ) {
      return (parsed as { success: true; data: T }).data;
    }

    return parsed as T;
  }

  return {
    request,
    health: () => request<{ ok: boolean; service?: string }>("/health"),
    me: (token: string) =>
      request<User>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
