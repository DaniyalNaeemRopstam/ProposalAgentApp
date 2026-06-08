/** Production Railway API (no trailing slash). Override with EXPO_PUBLIC_API_URL in .env or EAS. */
export const PRODUCTION_API_URL =
  "https://proposalagentapp-production.up.railway.app";

/** API origin (no trailing slash). Defaults to production so Expo Go works without a local .env. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;
