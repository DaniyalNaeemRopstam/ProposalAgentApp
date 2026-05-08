export interface AggregatedJobData {
  platform: "LinkedIn" | "Wellfound" | "HackerNews" | "Upwork";
  title: string;
  externalId: string;
  snippet: string;
  budget: string;
  posted: string;
  sourceUrl: string;
  client: {
    name: string;
    country: string;
    spent?: string | null;
    verified: boolean;
  };
  tags: string[];
  urgent?: boolean;
  isAggregated: boolean;
  fetchedAt: Date;
}
