import mongoose, { Schema } from "mongoose";

/** Singleton-style doc: at most one row; LinkedIn RapidAPI fallback when env is unset */
const appSettingsSchema = new Schema(
  {
    rapidApiKey: { type: String },
  },
  { timestamps: true }
);

export const AppSettings = mongoose.model("AppSettings", appSettingsSchema);

export async function getStoredRapidApiKey(): Promise<string | undefined> {
  const doc = await AppSettings.findOne().select("rapidApiKey").lean();
  const k = doc?.rapidApiKey?.trim();
  return k || undefined;
}
