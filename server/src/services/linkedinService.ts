import axios from "axios";
import slugify from "slugify";
import { getStoredRapidApiKey } from "../models/AppSettings";
import { AggregatedJobData } from "./aggregationTypes";

interface LinkedInJobResult {
  id?: string;
  title: string;
  company: string;
  description?: string;
  url?: string;
  applyUrl?: string;
  postedAt?: string;
  location?: string;
}

const RAPIDAPI_HOST = "linkedin-jobs-search.p.rapidapi.com";

const SEARCH_QUERIES = [
  { query: "React Native developer remote", remoteOnly: true },
  { query: "React Native engineer", remoteOnly: true },
  { query: "Expo React Native", remoteOnly: true },
  { query: "React Native mobile", remoteOnly: true },
  { query: "TypeScript React Native", remoteOnly: true },
];

/** Per-query cap (RapidAPI plan may clamp). */
const LINKEDIN_JOBS_LIMIT = 35;

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

export function extractTechTags(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  return TECH_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

async function resolveRapidApiKey(): Promise<string> {
  const env = process.env.RAPIDAPI_KEY?.trim();
  if (env) return env;
  const stored = await getStoredRapidApiKey();
  if (stored) return stored;
  return "";
}

export async function fetchLinkedInJobs(): Promise<AggregatedJobData[]> {
  const RAPIDAPI_KEY = await resolveRapidApiKey();
  if (!RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY environment variable is not set and no key stored in app settings");
  }

  try {
    const allJobs: LinkedInJobResult[] = [];

    for (const searchConfig of SEARCH_QUERIES) {
      try {
        const response = await axios.get(
          "https://linkedin-jobs-search.p.rapidapi.com/search",
          {
            params: {
              query: searchConfig.query,
              remote_only: searchConfig.remoteOnly,
              sort: "recency",
              limit: LINKEDIN_JOBS_LIMIT,
            },
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": RAPIDAPI_HOST,
            },
            timeout: 15000,
          }
        );
        if (Array.isArray(response.data)) {
          allJobs.push(...response.data);
        }
      } catch (e) {
        console.warn(
          `[linkedin] query failed: ${searchConfig.query}`,
          axios.isAxiosError(e) ? e.message : e
        );
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    const byKey = new Map<string, LinkedInJobResult>();
    for (const result of allJobs) {
      const id =
        result.id || slugify(`${result.title}-${result.company}`, { lower: true });
      if (!byKey.has(id)) byKey.set(id, result);
    }

    const uniq = [...byKey.values()];
    const rnRe = /react\s*native|react-native|\bexpo\b/i;
    const rnHits = uniq.filter((r) => rnRe.test(`${r.title} ${r.description || ""}`));
    const list = rnHits.length > 0 ? rnHits : uniq;

    return list.map((result) => ({
      platform: "LinkedIn" as const,
      title: result.title,
      externalId:
        result.id || slugify(`${result.title}-${result.company}`, { lower: true }),
      snippet: result.description?.slice(0, 250) || "",
      budget: extractBudget(result.description || "") || "See description",
      posted: result.postedAt || new Date().toISOString(),
      sourceUrl: result.url || result.applyUrl || "",
      client: {
        name: result.company,
        country: result.location?.trim() || "🌐 Remote",
        verified: false,
      },
      tags: extractTechTags(result.description || ""),
      isAggregated: true,
      fetchedAt: new Date(),
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error("LinkedIn API rate limited. Retry after 60 seconds.");
      }
      throw new Error(
        `LinkedIn API error: ${error.response?.status} - ${error.message}`
      );
    }
    throw error;
  }
}
