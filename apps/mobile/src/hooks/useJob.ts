import { useQuery } from "@tanstack/react-query";
import type { Job } from "@proposalagent/shared";
import { serverApi } from "../lib/api";

export function useJob(jobId?: string) {
  return useQuery({
    queryKey: ["job", jobId],
    enabled: Boolean(jobId),
    queryFn: async (): Promise<Job> =>
      serverApi.request<Job>(`/api/jobs/${encodeURIComponent(jobId!)}`),
    staleTime: 20 * 1000,
  });
}
