import axios from "axios";
import { getStoredRapidApiKey } from "../models/AppSettings";
import { AggregatedJobData } from "./aggregationTypes";

/** Fantastic.jobs "LinkedIn Job Search API" on RapidAPI (active-jb-* endpoints). */
const DEFAULT_RAPIDAPI_HOST = "linkedin-job-search-api.p.rapidapi.com";
const DEFAULT_ENDPOINT = "active-jb-7d";

interface FantasticJbJob {
  id?: string;
  title: string;
  organization?: string;
  description_text?: string;
  url?: string;
  date_posted?: string;
  remote_derived?: boolean;
  ai_work_arrangement?: string;
  locations_derived?: string[];
  salary_raw?: {
    currency?: string;
    value?: {
      minValue?: number;
      maxValue?: number;
      unitText?: string;
    };
  };
}

const TITLE_FILTERS = [
  "React Native",
  "React Native developer",
  "Expo React Native",
  "TypeScript React Native",
];

const TECH_KEYWORDS = [
  "React Native",
  "React",
  "Node.js",
  "MongoDB",
  "Express",
  "TypeScript",
  "GraphQL",
  "Firebase",
  "Redux",
  "MERN",
  "Flutter",
  "AWS",
  "PostgreSQL",
];

export function extractBudget(text: string): string | null {
  if (!text) return null;

  const patterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(\/(?:hour|hr|month|year|annually|hourly))?/gi,
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:k)?)\s*\/\s*(hour|hr|month|year|annually|hourly)/gi,
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(k\s*)?(?:per\s+)?(hour|hr|month|year|annually)/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return null;
}

function formatSalaryRaw(salary?: FantasticJbJob["salary_raw"]): string | null {
  if (!salary?.value) return null;
  const { minValue, maxValue, unitText } = salary.value;
  const cur = salary.currency || "USD";
  const unit = unitText?.toLowerCase().includes("hour") ? "/hr" : unitText ? `/${unitText}` : "";
  if (minValue != null && maxValue != null) {
    return `$${minValue}-$${maxValue}${unit} ${cur}`.trim();
  }
  if (minValue != null) return `$${minValue}${unit} ${cur}`.trim();
  return null;
}

export function extractTechTags(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  return TECH_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

function isRemoteJob(job: FantasticJbJob): boolean {
  if (job.remote_derived) return true;
  const arr = job.ai_work_arrangement?.toLowerCase() || "";
  if (arr.includes("remote")) return true;
  const loc = (job.locations_derived || []).join(" ").toLowerCase();
  return loc.includes("remote");
}

function resolveHost(): string {
  return process.env.RAPIDAPI_LINKEDIN_HOST?.trim() || DEFAULT_RAPIDAPI_HOST;
}

function resolveEndpoint(): string {
  return process.env.RAPIDAPI_LINKEDIN_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
}

async function resolveRapidApiKey(): Promise<string> {
  const env = process.env.RAPIDAPI_KEY?.trim();
  if (env) return env;
  const stored = await getStoredRapidApiKey();
  if (stored) return stored;
  return "";
}

function mapFantasticJob(result: FantasticJbJob): AggregatedJobData {
  const description = result.description_text || "";
  const location =
    result.locations_derived?.[0]?.trim() ||
    (isRemoteJob(result) ? "🌐 Remote" : "See listing");

  return {
    platform: "LinkedIn" as const,
    title: result.title,
    externalId: result.id || result.url || result.title,
    snippet: description.slice(0, 250),
    budget:
      formatSalaryRaw(result.salary_raw) ||
      extractBudget(description) ||
      "See description",
    posted: result.date_posted || new Date().toISOString(),
    sourceUrl: result.url || "",
    client: {
      name: result.organization || "Unknown Company",
      country: location,
      verified: false,
    },
    tags: extractTechTags(description),
    isAggregated: true,
    fetchedAt: new Date(),
  };
}

export async function fetchLinkedInJobs(): Promise<AggregatedJobData[]> {
  const RAPIDAPI_KEY = await resolveRapidApiKey();
  if (!RAPIDAPI_KEY) {
    throw new Error(
      "RAPIDAPI_KEY environment variable is not set and no key stored in app settings"
    );
  }

  const host = resolveHost();
  const endpoint = resolveEndpoint();
  const baseUrl = `https://${host}/${endpoint}`;

  try {
    const allJobs: FantasticJbJob[] = [];

    for (const titleFilter of TITLE_FILTERS) {
      try {
        const response = await axios.get<FantasticJbJob[]>(baseUrl, {
          params: {
            offset: 0,
            title_filter: titleFilter,
            location_filter: "Remote OR United States OR Worldwide",
            description_type: "text",
          },
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": host,
          },
          timeout: 30000,
        });
        if (Array.isArray(response.data)) {
          allJobs.push(...response.data);
        }
      } catch (e) {
        console.warn(
          `[linkedin] query failed: ${titleFilter}`,
          axios.isAxiosError(e) ? e.message : e
        );
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    const byKey = new Map<string, FantasticJbJob>();
    for (const result of allJobs) {
      const id = result.id || result.url || "";
      if (id && !byKey.has(id)) byKey.set(id, result);
    }

    const uniq = [...byKey.values()].filter((j) => j.url?.includes("linkedin.com"));
    const rnRe = /react\s*native|react-native|\bexpo\b/i;
    const rnHits = uniq.filter((r) =>
      rnRe.test(`${r.title} ${r.description_text || ""}`)
    );
    const list = rnHits.length > 0 ? rnHits : uniq;

    return list.map(mapFantasticJob).filter((j) => Boolean(j.sourceUrl));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error("LinkedIn API rate limited. Retry after 60 seconds.");
      }
      const msg =
        typeof error.response?.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data
          ? String((error.response.data as { message: string }).message)
          : error.message;
      throw new Error(`LinkedIn API error: ${error.response?.status} - ${msg}`);
    }
    throw error;
  }
}
