import { Job } from "../models/Job";

/** Remove dev/demo seeds (Wellfound example-N, HN item?id=example-N, etc.). */
export async function purgePlaceholderJobs(): Promise<number> {
  const result = await Job.deleteMany({
    $or: [
      { sourceUrl: { $regex: /example-/i } },
      { url: { $regex: /example-/i } },
      { externalId: { $regex: /^example-/i } },
      {
        platform: "HackerNews",
        sourceUrl: { $regex: /news\.ycombinator\.com\/item\?id=[^0-9]/i },
      },
    ],
  });
  return result.deletedCount ?? 0;
}
