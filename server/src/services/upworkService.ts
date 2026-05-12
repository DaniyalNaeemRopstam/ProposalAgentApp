import Parser from "rss-parser";
import { AggregatedJobData } from "./aggregationTypes";

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  guid?: string;
  content?: string;
  summary?: string;
  contentSnippet?: string;
}

/** Build Upwork RSS URL: `paging` is `offset;count` (semicolon encoded as %3B). */
function upworkRssFeed(query: string, offset: number, count: number): string {
  const paging = encodeURIComponent(`${offset};${count}`);
  return `https://www.upwork.com/ab/feed/jobs/rss?q=${encodeURIComponent(query)}&sort=recency&paging=${paging}`;
}

/** RN + remote-ish queries × pages (~600 slots pre-dedupe; aggregator dedups by guid). */
const REACT_NATIVE_QUERIES = [
  "react native",
  "react native developer",
  "react native remote",
  "expo react native",
  "react native typescript",
  "mobile react native engineer",
];

const UPWORK_PAGE_SIZE = 25;
const UPWORK_PAGES_PER_QUERY = 4;

function buildUpworkRssFeeds(): string[] {
  const urls: string[] = [];
  for (const q of REACT_NATIVE_QUERIES) {
    for (let p = 0; p < UPWORK_PAGES_PER_QUERY; p += 1) {
      urls.push(upworkRssFeed(q, p * UPWORK_PAGE_SIZE, UPWORK_PAGE_SIZE));
    }
  }
  return urls;
}

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

function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractBudget(text: string): string | null {
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

function extractTechTags(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  return TECH_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

function extractCountry(text?: string): string | null {
  if (!text) return null;

  const countryPatterns = [
    /(?:United States|USA|US|Canada|UK|United Kingdom|Australia|Germany|India|Philippines)/i,
  ];

  for (const pattern of countryPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

export async function fetchUpworkJobs(): Promise<AggregatedJobData[]> {
  const parser = new Parser({
    timeout: 10000,
  });

  try {
    const allItems: RSSItem[] = [];

    for (const feedUrl of buildUpworkRssFeeds()) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed.items) {
          allItems.push(...feed.items);
        }
        await new Promise((r) => setTimeout(r, 150));
      } catch (error) {
        console.error(`Error parsing Upwork feed ${feedUrl}:`, error);
      }
    }

    const merged = new Map<string, RSSItem>();
    for (const item of allItems) {
      const id = item.guid || item.link || "";
      if (id && !merged.has(id)) merged.set(id, item);
    }

    return [...merged.values()].map((item) => {
      const content = item.content || item.summary || item.contentSnippet || "";
      const fullText = `${item.title || ""} ${content}`;

      return {
        platform: "Upwork" as const,
        externalId: item.guid || item.link || "",
        title: item.title || "Upwork Job",
        snippet: stripHtml(content).slice(0, 250),
        budget: extractBudget(fullText) || "See posting",
        posted: item.pubDate || new Date().toISOString(),
        sourceUrl: item.link || "",
        client: {
          name: "Upwork Client",
          country: extractCountry(content) || "🌐 Remote",
          verified: false,
        },
        tags: extractTechTags(fullText),
        urgent: (item.title || "").toLowerCase().includes("urgent"),
        isAggregated: true,
        fetchedAt: new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching Upwork jobs:", error);
    throw error;
  }
}
