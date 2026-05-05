"use client";

import { useQuery } from "@tanstack/react-query";
import type { Job } from "@proposalagent/shared";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";

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

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async (): Promise<Job[]> => {
      const res = await fetch(apiUrl("/api/jobs"), {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });

      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Failed to fetch jobs");
      }

      const raw = await res.json();
      const data = parseEnvelope<unknown>(raw);
      return normalizeJobs(data);
    },
    staleTime: 30 * 1000,
  });
}
