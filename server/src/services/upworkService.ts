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

const UPWORK_RSS_FEEDS = [
  "https://www.upwork.com/ab/feed/jobs/rss?q=react+native&sort=recency&paging=0%3B10",
  "https://www.upwork.com/ab/feed/jobs/rss?q=mern+stack&sort=recency&paging=0%3B10",
  "https://www.upwork.com/ab/feed/jobs/rss?q=react+native+developer&budget=1000-&sort=recency",
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

    for (const feedUrl of UPWORK_RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        if (feed.items) {
          allItems.push(...feed.items);
        }
      } catch (error) {
        console.error(`Error parsing Upwork feed ${feedUrl}:`, error);
      }
    }

    return allItems.map((item) => {
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
