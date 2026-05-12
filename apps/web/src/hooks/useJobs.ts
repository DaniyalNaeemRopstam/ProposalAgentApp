"use client";

import { useQuery } from "@tanstack/react-query";
import type { Job } from "@proposalagent/shared";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { extractApiMessage, messageForHttpStatus, notifyHttpError } from "@/lib/apiErrors";

export type JobsSourceFilter = "all" | "aggregated" | "manual";

function normalizeJobs(payload: unknown): Job[] {
  if (Array.isArray(payload)) return payload as Job[];
  if (
    payload &&
    typeof payload === "object" &&
    "jobs" in payload &&
    Array.isArray((payload as { jobs: unknown }).jobs)
  ) {
    return (payload as { jobs: Job[] }).jobs;
  }
  return [];
}

export type UseJobsOptions = {
  /** Passed as `source` query param to GET /api/jobs */
  source?: JobsSourceFilter;
  minScore?: number;
  limit?: number;
  /** React Query refetch interval in ms (e.g. 15 minutes) */
  refetchInterval?: number | false;
};

export function useJobs(options?: UseJobsOptions) {
  const source = options?.source ?? "all";
  const minScore = options?.minScore ?? 60;
  const limit = options?.limit ?? 100;
  const refetchInterval = options?.refetchInterval ?? 1_000 * 60 * 15;

  return useQuery({
    queryKey: ["jobs", source, minScore, limit],
    queryFn: async (): Promise<Job[]> => {
      const params = new URLSearchParams({
        source,
        minScore: String(minScore),
        limit: String(limit),
        page: "1",
      });
      const res = await fetch(apiUrl(`/api/jobs?${params.toString()}`), {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });

      if (!res.ok) {
        const detail = await extractApiMessage(res);
        await notifyHttpError(res);
        throw new Error(detail ?? messageForHttpStatus(res.status));
      }

      const raw = await res.json();
      const data = parseEnvelope<unknown>(raw);
      return normalizeJobs(data);
    },
    staleTime: 30 * 1000,
    refetchInterval,
  });
}
