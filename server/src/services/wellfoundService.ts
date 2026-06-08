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

/** Remote-first listings; extra pages increase volume (Wellfound may ignore unknown params). */
const WELLFOUND_FEED_BASES = [
  "https://wellfound.com/jobs.json?keywords=React+Native&remote=true",
  "https://wellfound.com/jobs.json?role=mobile-developer&remote=true",
  "https://wellfound.com/jobs.json?role=full-stack-engineer&remote=true",
];

const WELLFOUND_PAGE_NUMBERS = [1, 2, 3];

function buildWellfoundFeeds(): string[] {
  const urls: string[] = [];
  for (const base of WELLFOUND_FEED_BASES) {
    for (const page of WELLFOUND_PAGE_NUMBERS) {
      const sep = base.includes("?") ? "&" : "?";
      urls.push(`${base}${sep}page=${page}`);
    }
  }
  return urls;
}

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
    const seenIds = new Set<string>();

    for (const feedUrl of buildWellfoundFeeds()) {
      try {
        const jobs = await fetchWithRetry(feedUrl);
        for (const j of jobs) {
          const id = j.id?.toString() || "";
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allJobs.push(j);
          }
        }
      } catch (e) {
        console.warn(`[wellfound] feed skipped: ${feedUrl}`, e);
      }
    }

    const lowerRn = /react\s*native|react-native|\bexpo\b/i;

    const rnRemote = allJobs.filter((j) => {
      const blob = `${j.title} ${j.description || ""}`;
      const mobileish =
        lowerRn.test(blob) ||
        (Array.isArray(j.skills) && j.skills.some((s) => lowerRn.test(s)));
      const remoteOk = Boolean(j.remote) || /\bworldwide\b|remote|distributed|anywhere/i.test(blob);
      return mobileish && remoteOk;
    });

    const source = rnRemote.length > 0 ? rnRemote : allJobs;

    return source
      .filter((result) => {
        const slug = result.slug?.trim() || "";
        if (!slug || slug === "/") return false;
        if (/\/jobs\/example-/i.test(slug)) return false;
        return true;
      })
      .map((result) => ({
      platform: "Wellfound" as const,
      externalId: result.id?.toString() || "",
      title: result.title,
      snippet: result.description?.slice(0, 250) || "",
      budget: result.salary || "Equity + Salary",
      posted: result.created_at,
      sourceUrl: `https://wellfound.com${result.slug}`,
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
