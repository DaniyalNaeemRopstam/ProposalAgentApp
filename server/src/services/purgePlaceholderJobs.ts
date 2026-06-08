import { Job } from "../models/Job";

/** Remove dev/demo seeds (e.g. wellfound.com/jobs/example-3) from all users' feeds. */
export async function purgePlaceholderJobs(): Promise<number> {
  const result = await Job.deleteMany({
    $or: [
      { sourceUrl: { $regex: /\/jobs\/example-\d+/i } },
      { url: { $regex: /\/jobs\/example-\d+/i } },
      { externalId: { $regex: /^example-/i } },
    ],
  });
  return result.deletedCount ?? 0;
}
