import type { FollowUpSequence, Job } from "./types";

/** Demo listing — same stories as ProposalAgent_MVP.jsx, mapped to API `Job` shape. */
export type DemoJob = Job & { isDemo: true };

const now = new Date();

export const SAMPLE_JOBS: DemoJob[] = [
  {
    _id: "demo-job-1",
    isDemo: true,
    platform: "Upwork",
    score: 94,
    title: "Senior React Native Developer for FinTech MVP",
    budget: "$8,000–$15,000",
    posted: "14 min ago",
    urgent: true,
    client: {
      name: "StartupCo",
      country: "🇺🇸 USA",
      spent: "$45k+",
      rating: 4.9,
      hires: 12,
      verified: true,
    },
    tags: ["React Native", "Node.js", "Stripe", "MVP"],
    snippet:
      "Looking for a senior RN dev to build our financial dashboard app. Must have experience with Plaid API integration and mobile payment flows...",
    reasons: [
      "Budget matches your Tier B range",
      "Client has $45k+ history — serious buyer",
      "React Native + Node — exact your stack",
      "First 3 applicants — posted 14 min ago",
    ],
    competition: "Low",
    timeline: "8 weeks",
    isAggregated: true,
  },
  {
    _id: "demo-job-2",
    isDemo: true,
    platform: "LinkedIn",
    score: 88,
    title: "CTO-for-Hire: SaaS Platform Architecture",
    budget: "$6,000/mo retainer",
    posted: "2 hrs ago",
    urgent: false,
    client: {
      name: "James Miller",
      country: "🇬🇧 UK",
      spent: "Series A",
      verified: true,
    },
    tags: ["MERN Stack", "AWS", "Technical Lead", "SaaS"],
    snippet:
      "We raised $2M seed. Need a fractional CTO to own our technical roadmap, hire engineers, and oversee delivery of v1. 3-month contract to start...",
    reasons: [
      "Funded startup — guaranteed budget",
      "Fractional CTO = your highest rate tier",
      "MERN stack — perfect fit",
      "Direct founder contact on LinkedIn",
    ],
    competition: "Medium",
    timeline: "3 months",
    isAggregated: true,
  },
  {
    _id: "demo-job-3",
    isDemo: true,
    platform: "Wellfound",
    score: 81,
    title: "React Native Developer — Healthcare App",
    budget: "$10,000–$20,000",
    posted: "1 day ago",
    urgent: false,
    client: {
      name: "MediTrack Inc",
      country: "🇨🇦 Canada",
      spent: "YC W25",
      verified: true,
    },
    tags: ["React Native", "Firebase", "HIPAA", "Healthcare"],
    snippet:
      "YC-backed healthtech building patient tracking app. Need senior RN dev for 8-week sprint. Firebase backend already set up. HIPAA compliance experience preferred...",
    reasons: [
      "YC-backed — fast decisions, good budget",
      "Firebase already set up — faster delivery",
      "Healthcare = govt project relevance",
      "8-week scope — clean timeline",
    ],
    competition: "Medium",
    timeline: "8 weeks",
    isAggregated: true,
  },
  {
    _id: "demo-job-4",
    isDemo: true,
    platform: "Freelancer",
    score: 76,
    title: "Full-Stack Engineer for Marketplace MVP",
    budget: "$5,000–$9,000",
    posted: "6 hrs ago",
    urgent: false,
    client: {
      name: "NovaLabs",
      country: "🇦🇺 Australia",
      spent: "$12k+",
      rating: 4.7,
      hires: 5,
      verified: true,
    },
    tags: ["React", "Node.js", "PostgreSQL", "Marketplace"],
    snippet:
      "Building a two-sided marketplace MVP. Need engineer comfortable with payments, listings, and admin dashboard. 6-week timeline with weekly milestones...",
    reasons: [
      "Fixed budget fits sprint delivery",
      "Marketplace scope aligns with past wins",
      "Client has repeat hire history",
      "Milestone-based — lower risk",
    ],
    competition: "Low",
    timeline: "6 weeks",
    isAggregated: true,
  },
];

export function findDemoJobById(id: string): DemoJob | undefined {
  return SAMPLE_JOBS.find((j) => j._id === id);
}

const overview = {
  proposalsSent: 23,
  repliesReceived: 7,
  projectsWon: 3,
  revenueWon: 18400,
  winRate: 13.0,
  replyRate: 30.4,
};

const monthly = [
  { month: "Jan", sent: 4, replied: 1, won: 0 },
  { month: "Feb", sent: 6, replied: 2, won: 1 },
  { month: "Mar", sent: 5, replied: 2, won: 1 },
  { month: "Apr", sent: 8, replied: 2, won: 1 },
];

const platforms = [
  { platform: "Upwork", count: 12, percentage: "52%", winRate: "17%", color: "#22D07A" },
  { platform: "LinkedIn", count: 7, percentage: "30%", winRate: "14%", color: "#4F7CFF" },
  { platform: "Wellfound", count: 4, percentage: "18%", winRate: "25%", color: "#A78BFA" },
];

const insights = [
  {
    type: "positive" as const,
    text: "Proposals mentioning a specific past project in the first paragraph get 2.1× more replies.",
  },
  {
    type: "warning" as const,
    text: "Jobs posted >48h ago convert 40% worse — prioritize fresh listings in your queue.",
  },
  {
    type: "suggestion" as const,
    text: "Try the “speed” variant on sub-$5k budgets; win rate is up 8% on your last 10 sends.",
  },
];

/** Unified guest analytics bundle for web + mobile hooks. */
export const SAMPLE_ANALYTICS = {
  overview,
  monthly,
  platforms,
  insights,
} as const;

export const SAMPLE_SEQUENCES: FollowUpSequence[] = [
  {
    _id: "demo-seq-1",
    proposalId: "demo-prop-1",
    userId: "demo",
    jobTitle: "Senior React Native Developer for FinTech MVP",
    platform: "Upwork",
    status: "active",
    viewed: true,
    createdAt: now,
    isDemo: true,
    messages: [
      {
        day: 3,
        content:
          "Hi — wanted to bump this in case it got buried. Happy to share a 2-min Loom on how I'd structure the Plaid + RN flow if useful.",
        status: "sent",
        scheduledAt: new Date(now.getTime() - 2 * 86400000),
        sentAt: new Date(now.getTime() - 2 * 86400000),
      },
      {
        day: 7,
        content:
          "Quick follow-up: I shipped a similar fintech MVP last quarter (budgeting + bank link). Can walk through architecture on a short call this week.",
        status: "pending",
        scheduledAt: new Date(now.getTime() + 2 * 86400000),
      },
      {
        day: 14,
        content:
          "Last note from me — if timing isn't right, no worries. I'll keep an eye out for future RN roles on your profile.",
        status: "pending",
        scheduledAt: new Date(now.getTime() + 9 * 86400000),
      },
    ],
  },
  {
    _id: "demo-seq-2",
    proposalId: "demo-prop-2",
    userId: "demo",
    jobTitle: "CTO-for-Hire: SaaS Platform Architecture",
    platform: "LinkedIn",
    status: "replied",
    viewed: true,
    createdAt: now,
    isDemo: true,
    messages: [
      {
        day: 3,
        content:
          "James — enjoyed your post on the seed round. I put together a one-pager on how I'd phase v1 delivery with a fractional CTO model.",
        status: "sent",
        scheduledAt: new Date(now.getTime() - 5 * 86400000),
        sentAt: new Date(now.getTime() - 5 * 86400000),
      },
      {
        day: 7,
        content:
          "Following up on the roadmap doc — open to a 15-min call to align on hiring plan + first sprint milestones.",
        status: "sent",
        scheduledAt: new Date(now.getTime() - 1 * 86400000),
        sentAt: new Date(now.getTime() - 1 * 86400000),
      },
      {
        day: 14,
        content: "Sequence stopped — client replied.",
        status: "skipped",
        scheduledAt: new Date(now.getTime() + 6 * 86400000),
      },
    ],
  },
];

export type DemoPipelineDeal = {
  _id: string;
  title: string;
  client: string;
  budget: string;
  platform: string;
  stage: "applied" | "replied" | "discovery" | "proposed" | "negotiating" | "won" | "lost";
  notes?: string;
  nextAction?: string;
  isDemo?: true;
};

/** Guest kanban: three demo deals across stages (subset of full demo CRM). */
export const SAMPLE_DEALS: DemoPipelineDeal[] = [
  {
    _id: "demo-deal-1",
    isDemo: true,
    title: "FinTech MVP — RN",
    client: "StartupCo",
    budget: "$12,000",
    platform: "Upwork",
    stage: "proposed",
    nextAction: "Follow up Day 7",
  },
  {
    _id: "demo-deal-2",
    isDemo: true,
    title: "Fractional CTO — SaaS",
    client: "James Miller",
    budget: "$6k/mo",
    platform: "LinkedIn",
    stage: "discovery",
    nextAction: "Scope call Fri",
  },
  {
    _id: "demo-deal-3",
    isDemo: true,
    title: "Healthcare RN Sprint",
    client: "MediTrack Inc",
    budget: "$15,000",
    platform: "Wellfound",
    stage: "applied",
  },
];

/** Alias for mobile naming parity. */
export const SAMPLE_PIPELINE = SAMPLE_DEALS;

export function guestPipelineGrouped(): Record<
  DemoPipelineDeal["stage"],
  DemoPipelineDeal[]
> {
  const grouped = {
    applied: [] as DemoPipelineDeal[],
    replied: [] as DemoPipelineDeal[],
    discovery: [] as DemoPipelineDeal[],
    proposed: [] as DemoPipelineDeal[],
    negotiating: [] as DemoPipelineDeal[],
    won: [] as DemoPipelineDeal[],
    lost: [] as DemoPipelineDeal[],
  };
  for (const d of SAMPLE_DEALS) {
    grouped[d.stage].push(d);
  }
  return grouped;
}

/** Rough pipeline value for guest preview (3 deals). */
export const SAMPLE_PIPELINE_TOTAL_VALUE = 33000;
