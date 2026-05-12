import axios from "axios";
import { AggregatedJobData } from "./aggregationTypes";

interface HNItem {
  id: number;
  type: string;
  text?: string;
  time: number;
  kids?: number[];
}

interface HNSearchResult {
  hits: Array<{
    objectID: string;
    title: string;
    created_at_i: number;
  }>;
}

const TECH_KEYWORDS = [
  "React Native",
  "react-native",
  "Expo",
  "React",
  "Node",
  "MERN",
  "mobile",
  "TypeScript",
  "MongoDB",
  "Express",
  "GraphQL",
];

/** Comments to pull from Who's Hiring (top-level; higher = longer run). */
const HN_COMMENT_LIMIT = 400;
const HN_BATCH_SIZE = 12;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseCompanyName(text: string): string {
  const lines = text.split("\n");
  const firstLine = lines[0]?.trim() || "Company";
  return firstLine.replace(/[^\w\s&-]/g, "").slice(0, 100);
}

function extractSalary(text: string): string | null {
  const lowerText = text.toLowerCase();

  const patterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(\/(?:hour|hr|month|year|annually))?/gi,
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:k)?)\s*\/\s*(hour|hr|month|year|annually)/gi,
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
  const lowerText = text.toLowerCase();
  return TECH_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

function isRelevantComment(text: string): boolean {
  const lowerText = text.toLowerCase();
  const hasRN =
    lowerText.includes("react native") ||
    lowerText.includes("react-native") ||
    /\bexpo\b/i.test(lowerText);
  const hasRelevantTech = TECH_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
  const hasRemote =
    lowerText.includes("remote") ||
    lowerText.includes("worldwide") ||
    lowerText.includes("distributed") ||
    lowerText.includes("anywhere");
  return hasRemote && (hasRN || hasRelevantTech);
}

async function findCurrentMonthThread(): Promise<number | null> {
  try {
    const response = await axios.get<HNSearchResult>(
      "https://hn.algolia.com/api/v1/search",
      {
        params: {
          query: "Ask HN Who is hiring",
          tags: "story",
          hitsPerPage: 5,
        },
        timeout: 10000,
      }
    );

    const now = new Date();
    const currentMonth = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const monthMatch = response.data.hits.find((hit) =>
      hit.title.toLowerCase().includes(currentMonth.toLowerCase())
    );

    if (monthMatch) {
      return parseInt(monthMatch.objectID);
    }

    return null;
  } catch (error) {
    console.error("Error finding HN thread:", error);
    return null;
  }
}

async function getThreadCommentIds(threadId: number): Promise<number[]> {
  try {
    const response = await axios.get<HNItem>(
      `https://hacker-news.firebaseio.com/v0/item/${threadId}.json`,
      { timeout: 10000 }
    );
    return response.data.kids || [];
  } catch (error) {
    console.error(`Error fetching thread ${threadId}:`, error);
    return [];
  }
}

async function getComment(commentId: number): Promise<HNItem | null> {
  try {
    const response = await axios.get<HNItem>(
      `https://hacker-news.firebaseio.com/v0/item/${commentId}.json`,
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function fetchCommentsInBatches(
  commentIds: number[],
  batchSize: number = HN_BATCH_SIZE,
  limit: number = HN_COMMENT_LIMIT
): Promise<HNItem[]> {
  const ids = commentIds.slice(0, limit);
  const comments: HNItem[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchComments = await Promise.all(
      batch.map((id) => getComment(id))
    );
    comments.push(...batchComments.filter((c) => c !== null));

    if (i + batchSize < ids.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return comments;
}

export async function fetchHackerNewsJobs(): Promise<AggregatedJobData[]> {
  try {
    const threadId = await findCurrentMonthThread();
    if (!threadId) {
      console.warn("Could not find current month's HN hiring thread");
      return [];
    }

    const commentIds = await getThreadCommentIds(threadId);
    const comments = await fetchCommentsInBatches(commentIds);

    const relevantComments = comments.filter(
      (c) => c?.text && isRelevantComment(c.text)
    );

    return relevantComments.map((comment) => ({
      platform: "HackerNews" as const,
      externalId: comment.id.toString(),
      title: `${parseCompanyName(comment.text || "")} — Remote Developer`,
      snippet: stripHtml(comment.text || "").slice(0, 300),
      budget: extractSalary(comment.text || "") || "Competitive",
      posted: new Date(comment.time * 1000).toISOString(),
      sourceUrl: `https://news.ycombinator.com/item?id=${comment.id}`,
      client: {
        name: parseCompanyName(comment.text || ""),
        country: "🌐 Remote",
        verified: false,
      },
      tags: extractTechTags(comment.text || ""),
      isAggregated: true,
      fetchedAt: new Date(),
    }));
  } catch (error) {
    console.error("Error fetching HackerNews jobs:", error);
    throw error;
  }
}
