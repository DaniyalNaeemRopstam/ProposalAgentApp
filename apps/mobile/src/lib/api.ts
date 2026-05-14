import { createApiClient } from "@proposalagent/api-client";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_URL } from "../constants/config";
import { getStoredToken } from "./tokenStorage";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Android emulator: `localhost` / `127.0.0.1` is the emulator itself, not the host machine.
 * `10.0.2.2` is the special alias to the host loopback interface.
 */
function rewriteLocalhostForAndroidEmulator(base: string): string {
  const trimmed = base.replace(/\/$/, "");
  if (Platform.OS !== "android" || !__DEV__) return trimmed;
  if (trimmed.startsWith("http://localhost"))
    return trimmed.replace(/^http:\/\/localhost/, "http://10.0.2.2");
  if (trimmed.startsWith("http://127.0.0.1"))
    return trimmed.replace(/^http:\/\/127\.0\.0\.1/, "http://10.0.2.2");
  return trimmed;
}

/** Normalised API origin (no trailing slash). */
export function getApiBaseUrl(): string {
  const raw =
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
    API_URL;
  return rewriteLocalhostForAndroidEmulator(String(raw));
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
