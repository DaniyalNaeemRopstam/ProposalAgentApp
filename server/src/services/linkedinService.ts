import type { AggregatedJobData } from "./aggregationTypes";
import { extractBudget, extractTechTags, fetchFantasticJobs } from "./fantasticJobsRapidApi";

export { extractBudget, extractTechTags };

const TITLE_FILTERS = [
  "React Native",
  "React Native developer",
  "Expo React Native",
  "TypeScript React Native",
];

export async function fetchLinkedInJobs(): Promise<AggregatedJobData[]> {
  return fetchFantasticJobs({
    logTag: "linkedin",
    platform: "LinkedIn",
    source: "linkedin",
    titleFilters: TITLE_FILTERS,
    urlIncludes: "linkedin.com",
  });
}
