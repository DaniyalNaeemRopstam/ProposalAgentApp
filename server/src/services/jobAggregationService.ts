import { fetchLinkedInJobs } from "./linkedinService";
import { fetchWellfoundJobs } from "./wellfoundService";
import { fetchHackerNewsJobs } from "./hackerNewsService";
import { fetchUpworkJobs } from "./upworkService";
import { AggregatedJobData } from "./aggregationTypes";

interface AggregationOptions {
  sources?: ("linkedin" | "wellfound" | "hackernews" | "upwork")[];
  maxRetries?: number;
}

interface AggregationResult {
  success: AggregatedJobData[];
  errors: Array<{
    source: string;
    error: string;
  }>;
  timestamp: Date;
  totalFetched: number;
}

export async function aggregateJobs(
  options: AggregationOptions = {}
): Promise<AggregationResult> {
  const sources = options.sources || [
    "linkedin",
    "wellfound",
    "hackernews",
    "upwork",
  ];

  const result: AggregationResult = {
    success: [],
    errors: [],
    timestamp: new Date(),
    totalFetched: 0,
  };

  const sourceMap = {
    linkedin: {
      name: "LinkedIn",
      fetch: fetchLinkedInJobs,
    },
    wellfound: {
      name: "Wellfound",
      fetch: fetchWellfoundJobs,
    },
    hackernews: {
      name: "HackerNews",
      fetch: fetchHackerNewsJobs,
    },
    upwork: {
      name: "Upwork",
      fetch: fetchUpworkJobs,
    },
  };

  for (const source of sources) {
    if (!(source in sourceMap)) {
      result.errors.push({
        source,
        error: `Unknown source: ${source}`,
      });
      continue;
    }

    try {
      console.log(`Fetching jobs from ${sourceMap[source].name}...`);
      const jobs = await sourceMap[source].fetch();
      result.success.push(...jobs);
      result.totalFetched += jobs.length;
      console.log(
        `Successfully fetched ${jobs.length} jobs from ${sourceMap[source].name}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push({
        source: sourceMap[source].name,
        error: errorMessage,
      });
      console.error(
        `Error fetching from ${sourceMap[source].name}: ${errorMessage}`
      );
    }
  }

  return result;
}

export async function aggregateJobsInParallel(
  options: AggregationOptions = {}
): Promise<AggregationResult> {
  const sources = options.sources || [
    "linkedin",
    "wellfound",
    "hackernews",
    "upwork",
  ];

  const result: AggregationResult = {
    success: [],
    errors: [],
    timestamp: new Date(),
    totalFetched: 0,
  };

  const sourceMap = {
    linkedin: {
      name: "LinkedIn",
      fetch: fetchLinkedInJobs,
    },
    wellfound: {
      name: "Wellfound",
      fetch: fetchWellfoundJobs,
    },
    hackernews: {
      name: "HackerNews",
      fetch: fetchHackerNewsJobs,
    },
    upwork: {
      name: "Upwork",
      fetch: fetchUpworkJobs,
    },
  };

  const promises = sources.map(async (source) => {
    if (!(source in sourceMap)) {
      return {
        source,
        jobs: null,
        error: `Unknown source: ${source}`,
      };
    }

    try {
      console.log(`Fetching jobs from ${sourceMap[source].name}...`);
      const jobs = await sourceMap[source].fetch();
      console.log(
        `Successfully fetched ${jobs.length} jobs from ${sourceMap[source].name}`
      );
      return {
        source,
        jobs,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Error fetching from ${sourceMap[source].name}: ${errorMessage}`
      );
      return {
        source,
        jobs: null,
        error: errorMessage,
      };
    }
  });

  const results = await Promise.all(promises);

  for (const res of results) {
    if (res.error) {
      result.errors.push({
        source: res.source,
        error: res.error,
      });
    } else if (res.jobs) {
      result.success.push(...res.jobs);
      result.totalFetched += res.jobs.length;
    }
  }

  return result;
}
