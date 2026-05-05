import type { Job } from "@proposalagent/shared";

/** Job payload used for proposal generation (shared shape or API-returned jobs). */
export type ApiJobRecord = Job;

export type ProposalMode = "upwork" | "linkedin" | "email";
export type ProposalVariant = "quality" | "price" | "speed";

export function normalizeJobId(id: unknown): string {
  if (id == null) return "";
  if (typeof id === "string") return id;
  if (
    typeof id === "object" &&
    "toString" in id &&
    typeof (id as { toString(): unknown }).toString === "function"
  ) {
    return String((id as { toString(): string }).toString());
  }
  return "";
}

export function isLikelyMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export function jobScore(job: ApiJobRecord): number {
  return typeof job.score === "number" && !Number.isNaN(job.score)
    ? Math.round(job.score)
    : 85;
}

export function mapPlatformToMode(platform: string): ProposalMode {
  const p = platform.trim().toLowerCase();
  if (p.includes("upwork")) return "upwork";
  if (p.includes("linkedin")) return "linkedin";
  return "email";
}

export function buildJobDescription(job: ApiJobRecord): string {
  const full = typeof job.fullDescription === "string" ? job.fullDescription.trim() : "";
  const snap = typeof job.snippet === "string" ? job.snippet.trim() : "";
  const raw = full || snap || "Job description unavailable.";
  if (raw.length >= 10) return raw;
  return `${raw} ${"—".repeat(10)}`.slice(0, 500);
}

export function buildGenerateBody(
  job: ApiJobRecord,
  jobIdMongo: string,
  mode: ProposalMode,
  variant: ProposalVariant
) {
  const cn =
    typeof job.client?.name === "string" && job.client.name.trim().length
      ? job.client.name.trim()
      : "Client";
  const cc =
    typeof job.client?.country === "string" && job.client.country.trim().length
      ? job.client.country.trim()
      : "Remote";

  const tags = Array.isArray(job.tags) ? job.tags.map(String) : [];
  const platform =
    typeof job.platform === "string" && String(job.platform).trim().length
      ? String(job.platform)
      : "Custom";

  return {
    jobId: jobIdMongo,
    jobTitle: typeof job.title === "string" ? job.title : "Untitled opportunity",
    jobDescription: buildJobDescription(job),
    jobBudget:
      typeof job.budget === "string" && job.budget.trim().length ? job.budget : "TBD",
    platform,
    clientName: cn,
    clientCountry: cc,
    tags,
    mode,
    variant,
  };
}

export interface GenerateEnvelope {
  proposal: {
    _id: string;
    content?: string;
    replyProbability?: number;
    proposalScore?: number;
  };
  wordCount?: number;
  replyProbability: number;
  proposalScore: number;
}
