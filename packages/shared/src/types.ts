// User & Auth

export interface User {
  _id: string;
  name: string;
  email: string;
  companyName: string; // e.g. "DanielForge Technologies LLC"
  avatar?: string;
  plan: "free" | "solo" | "pro" | "enterprise";
  stripeCustomerId?: string;
  createdAt: Date;
  voiceProfile?: string; // User's writing style for AI proposals
  projectLibrary: ProjectReference[];
  stats: UserStats;
}

export interface UserStats {
  proposalsSent: number;
  repliesReceived: number;
  projectsWon: number;
  revenueWon: number;
  winRate: number;
  replyRate: number;
}

export interface ProjectReference {
  _id: string;
  title: string;
  client: string;
  outcome: string; // e.g. "100k+ government users"
  stack: string[];
  budget: string;
}

// Jobs

export interface Job {
  _id: string;
  platform: "Upwork" | "LinkedIn" | "Wellfound" | "Freelancer" | "HackerNews" | "Custom";
  title: string;
  budget: string;
  posted: string;
  urgent: boolean;
  score: number; // AI match score 0-100
  client: ClientInfo;
  tags: string[];
  snippet: string;
  fullDescription?: string;
  reasons: string[]; // AI-generated reasons to apply
  competition: string;
  timeline: string;
  url?: string;
  savedAt?: Date;
  /** Original listing URL (aggregated / sourced jobs) */
  sourceUrl?: string;
  externalId?: string;
  fetchedAt?: Date;
  isAggregated?: boolean;
  /** Preview / guest mode sample listing — not from the API */
  isDemo?: boolean;
}

export interface ClientInfo {
  name: string;
  country: string;
  spent?: string;
  rating?: number;
  hires?: number;
  verified: boolean;
}

// Proposals

export interface Proposal {
  _id: string;
  userId: string;
  jobId?: string;
  job: Partial<Job>;
  mode: "upwork" | "linkedin" | "email";
  variant: "quality" | "price" | "speed";
  content: string;
  wordCount: number;
  replyProbability: number;
  proposalScore: number;
  status: "draft" | "sent" | "viewed" | "replied" | "shortlisted" | "won" | "lost";
  sentAt?: Date;
  repliedAt?: Date;
  createdAt: Date;
  followUpSequence?: FollowUpSequence;
}

// Follow-up Sequences

export interface FollowUpSequence {
  _id: string;
  proposalId: string;
  userId: string;
  jobTitle: string;
  platform: string;
  status: "active" | "replied" | "stopped";
  viewed: boolean;
  messages: FollowUpMessage[];
  createdAt: Date;
  /** Guest preview rows only */
  isDemo?: boolean;
}

export interface FollowUpMessage {
  day: 3 | 7 | 14;
  content: string;
  status: "pending" | "sent" | "skipped";
  scheduledAt: Date;
  sentAt?: Date;
}

// CRM Pipeline

export interface PipelineDeal {
  _id: string;
  userId: string;
  title: string;
  client: string;
  budget: string;
  platform: string;
  stage: "applied" | "replied" | "discovery" | "proposed" | "negotiating" | "won" | "lost";
  proposalId?: string;
  notes?: string;
  nextAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics

export interface AnalyticsData {
  monthly: MonthlyData[];
  platformBreakdown: PlatformData[];
  insights: AIInsight[];
  tierPerformance: Array<{
    variant: "quality" | "price" | "speed";
    sent: number;
    won: number;
    winRate: string;
  }>;
}

export interface MonthlyData {
  month: string;
  sent: number;
  replied: number;
  won: number;
}

export interface PlatformData {
  platform: string;
  count: number;
  percentage: string;
  winRate: string;
  color: string;
}

export interface AIInsight {
  type: "positive" | "warning" | "suggestion";
  text: string;
}
