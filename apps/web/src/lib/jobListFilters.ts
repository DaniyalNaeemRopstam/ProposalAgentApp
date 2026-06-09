import type { Job } from "@proposalagent/shared";
import type { JobsSearchFilters, JobDateRange } from "@/components/jobs/JobsSearchFilter";

function jobTimestamp(job: Job): number | null {
  const ext = job as Job & { postedAt?: string | Date; fetchedAt?: string | Date };
  for (const raw of [ext.postedAt, ext.fetchedAt]) {
    if (!raw) continue;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return null;
}

function matchesDateRange(ts: number | null, range: JobDateRange): boolean {
  if (range === "all") return true;
  if (ts == null) return true;
  const day = 86400000;
  const windowMs = range === "24h" ? day : range === "7d" ? 7 * day : 30 * day;
  return Date.now() - ts <= windowMs;
}

export function applyJobsSearchFilters(jobs: Job[], filters: JobsSearchFilters): Job[] {
  const q = filters.query.trim().toLowerCase();
  const skill = filters.skill.trim().toLowerCase();
  const platforms = new Set(filters.platforms);

  return jobs.filter((job) => {
    if (platforms.size > 0 && !platforms.has(job.platform)) return false;
    if (!matchesDateRange(jobTimestamp(job), filters.dateRange)) return false;

    if (skill) {
      const tagHit = (job.tags ?? []).some((t) => t.toLowerCase().includes(skill));
      const blob = `${job.title} ${job.snippet} ${job.tags?.join(" ") ?? ""}`.toLowerCase();
      if (!tagHit && !blob.includes(skill)) return false;
    }

    if (q) {
      const haystack = [
        job.title,
        job.snippet,
        job.platform,
        job.budget,
        job.client?.name,
        job.client?.country,
        ...(job.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function collectJobPlatforms(jobs: Job[]): string[] {
  const set = new Set(jobs.map((j) => j.platform).filter(Boolean));
  return Array.from(set).sort();
}

export function collectJobSkills(jobs: Job[]): string[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    for (const tag of job.tags ?? []) {
      const t = tag.trim();
      if (!t) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
    .slice(0, 16);
}
