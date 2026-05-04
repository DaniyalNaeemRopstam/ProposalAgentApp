import Constants from "expo-constants";

export function apiUrl(path: string): string {
  const baseUrl = 
    Constants.expoConfig?.extra?.apiUrl ?? 
    "http://localhost:5000";
  
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
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