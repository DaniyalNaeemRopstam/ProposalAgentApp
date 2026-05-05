import { createApiClient } from "@proposalagent/api-client";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Normalised API origin (no trailing slash). */
export function getApiBaseUrl(): string {
  const raw =
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
    "http://localhost:5000";
  return String(raw).replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalized}`;
}

/** Authenticated calls — sends `Authorization` when token exists. */
export const serverApi = createApiClient(getApiBaseUrl(), {
  getExtraHeaders: getAuthHeaders,
});

/** Login/register — never sends stale bearer tokens. */
export const serverApiPublic = createApiClient(getApiBaseUrl());

/** Legacy unwrap for rare non-standard payloads. Prefer `serverApi.request`. */
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
