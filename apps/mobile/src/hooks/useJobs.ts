import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SAMPLE_JOBS, type Job } from "@proposalagent/shared";
import { useAuth } from "../context/AuthContext";
import { serverApi } from "../lib/api";

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

/** Matches web `JobsSourceFilter` / GET `source` query. */
export type JobsSourceFilter = "all" | "aggregated" | "manual";

export interface UseJobsOptions {
  /** Passed as `source` to GET /api/jobs */
  source?: JobsSourceFilter;
  minScore?: number;
  limit?: number;
  /** Same as web: background refetch interval (ms). `false` disables. */
  refetchInterval?: number | false;
}

export interface UseJobsResult {
  data: Job[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
  lastSync: Date | null;
  /** Guest preview mode — `SAMPLE_JOBS` */
  isDemo: boolean;
}

const DEFAULT_MIN_SCORE = 60;
const DEFAULT_LIMIT = 100;
const DEFAULT_REFETCH_MS = 1_000 * 60 * 15;

export function useJobs(options?: UseJobsOptions): UseJobsResult {
  const { isGuest } = useAuth();
  const source = options?.source ?? "all";
  const minScore = options?.minScore ?? DEFAULT_MIN_SCORE;
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const refetchInterval = options?.refetchInterval ?? DEFAULT_REFETCH_MS;

  const [lastSync, setLastSync] = React.useState<Date | null>(null);

  const query = useQuery({
    queryKey: ["jobs", source, minScore, limit, isGuest ? "guest" : "auth"],
    queryFn: async (): Promise<Job[]> => {
      if (isGuest) return [...SAMPLE_JOBS];
      const params = new URLSearchParams({
        source,
        minScore: String(minScore),
        limit: String(limit),
        page: "1",
      });
      const raw = await serverApi.request<unknown>(`/api/jobs?${params.toString()}`);
      setLastSync(new Date());
      return normalizeJobs(raw);
    },
    staleTime: 30 * 1000,
    refetchInterval: isGuest ? false : refetchInterval,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: () => void query.refetch(),
    isRefetching: query.isRefetching,
    lastSync,
    isDemo: Boolean(isGuest),
  };
}

/** Paste raw text: server scores via Claude and persists the job (POST /api/jobs/save). */
export function useAnalyzePasteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pastedText: string) => {
      const text = pastedText.trim();
      if (!text) throw new Error("Paste a job description first.");

      const body = {
        platform: "Custom" as const,
        title: "Pasted opportunity",
        budget: "—",
        posted: "just now",
        urgent: false,
        client: {
          name: "Unknown client",
          country: "🌐 Global",
          verified: false,
        },
        tags: ["pasted"],
        snippet: text.length > 800 ? `${text.slice(0, 800)}…` : text,
        fullDescription: text,
        competition: "",
        timeline: "",
      };

      try {
        return await serverApi.request<Job>("/api/jobs/save", {
          method: "POST",
          body,
        });
      } catch (e) {
        const error = e as { message?: unknown };
        const msg =
          typeof error.message === "string" ? error.message : "Failed to analyze job";
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/** Archive / skip job (DELETE /api/jobs/:id). */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await serverApi.request<unknown>(
        `/api/jobs/${encodeURIComponent(jobId)}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
