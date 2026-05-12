import { Job } from "../models/Job";

/** Drop pre–multi-tenant unique index so each user can have the same external job id. */
export async function ensureJobIndexes(): Promise<void> {
  try {
    await Job.collection.dropIndex("externalId_1_platform_1");
    console.info("[mongo] dropped legacy externalId+platform unique index");
  } catch {
    /* index already removed */
  }
  await Job.syncIndexes();
}
