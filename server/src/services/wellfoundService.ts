import type { AggregatedJobData } from "./aggregationTypes";
import { fetchFantasticJobs } from "./fantasticJobsRapidApi";

const TITLE_FILTERS = [
  "React Native",
  "Mobile Developer",
  "Full Stack Engineer",
  "Software Engineer",
];

/**
 * Wellfound direct JSON feeds (wellfound.com/jobs.json) return 403 from servers.
 * Uses the same Fantastic.jobs RapidAPI subscription as LinkedIn with source=wellfound.
 */
export async function fetchWellfoundJobs(): Promise<AggregatedJobData[]> {
  try {
    return await fetchFantasticJobs({
      logTag: "wellfound",
      platform: "Wellfound",
      source: "wellfound",
      titleFilters: TITLE_FILTERS,
      urlIncludes: "wellfound.com",
    });
  } catch (error) {
    console.error("Error fetching Wellfound jobs:", error);
    throw error;
  }
}
