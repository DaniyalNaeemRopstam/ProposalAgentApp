import axios from "axios";
import { AggregatedJobData } from "./aggregationTypes";

interface WellfoundJob {
  id?: number;
  title: string;
  description?: string;
  salary?: string;
  created_at: string;
  slug?: string;
  startup?: {
    name: string;
    location?: string;
    funding?: string;
    verified?: boolean;
  };
  remote?: boolean;
  skills?: string[];
}

const WELLFOUND_FEEDS = [
  "https://wellfound.com/jobs.json?role=mobile-developer&remote=true",
  "https://wellfound.com/jobs.json?role=full-stack-engineer&remote=true",
];

const API_TIMEOUT = 10000;
const RATE_LIMIT_RETRY_DELAY = 60000;

async function fetchWithRetry(url: string, retries = 3): Promise<WellfoundJob[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: API_TIMEOUT });
      return Array.isArray(response.data) ? response.data : response.data.jobs || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          if (attempt < retries - 1) {
            console.log(`Rate limited. Waiting ${RATE_LIMIT_RETRY_DELAY}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY));
            continue;
          }
          throw new Error("Wellfound API rate limit exceeded after retries");
        }
        if (attempt === retries - 1) {
          throw new Error(`Wellfound API error: ${error.response?.status} - ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }
  return [];
}

export async function fetchWellfoundJobs(): Promise<AggregatedJobData[]> {
  try {
    const allJobs: WellfoundJob[] = [];

    for (const feedUrl of WELLFOUND_FEEDS) {
      const jobs = await fetchWithRetry(feedUrl);
      allJobs.push(...jobs);
    }

    return allJobs.map((result) => ({
      platform: "Wellfound" as const,
      externalId: result.id?.toString() || "",
      title: result.title,
      snippet: result.description?.slice(0, 250) || "",
      budget: result.salary || "Equity + Salary",
      posted: result.created_at,
      sourceUrl: `https://wellfound.com${result.slug || ""}`,
      client: {
        name: result.startup?.name || "Unknown Startup",
        country: result.remote ? "🌐 Remote" : result.startup?.location || "Unknown",
        spent: result.startup?.funding || null,
        verified: result.startup?.verified || false,
      },
      tags: result.skills || [],
      urgent: false,
      isAggregated: true,
      fetchedAt: new Date(),
    }));
  } catch (error) {
    console.error("Error fetching Wellfound jobs:", error);
    throw error;
  }
}
