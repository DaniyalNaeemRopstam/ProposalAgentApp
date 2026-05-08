import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Job } from "@proposalagent/shared";
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

export type JobsPlatformFilter = "all" | "Upwork" | "LinkedIn" | "Wellfound" | "aggregated" | "manual";

export interface UseJobsResult {
  data: Job[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
  lastSync: Date | null;
}

export function useJobs(filter: JobsPlatformFilter = "all"): UseJobsResult {
  const [lastSync, setLastSync] = React.useState<Date | null>(null);

  const query = useQuery({
    queryKey: ["jobs", filter],
    queryFn: async (): Promise<Job[]> => {
      const params = new URLSearchParams();
      
      if (filter === "aggregated") {
        params.append("source", "aggregated");
      } else if (filter === "manual") {
        params.append("source", "manual");
      } else if (filter !== "all") {
        params.append("platform", filter);
      }

      const qs = params.toString() ? `?${params.toString()}` : "";
      const raw = await serverApi.request<unknown>(`/api/jobs${qs}`);
      setLastSync(new Date());
      return normalizeJobs(raw);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes for aggregated jobs
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: () => void query.refetch(),
    isRefetching: query.isRefetching,
    lastSync,
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
