import { useQuery } from "@tanstack/react-query";
import { findDemoJobById, type Job } from "@proposalagent/shared";
import { useAuth } from "../context/AuthContext";
import { serverApi } from "../lib/api";

export function useJob(jobId?: string) {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["job", jobId, isGuest ? "guest" : "auth"],
    enabled: Boolean(jobId),
    queryFn: async (): Promise<Job> => {
      if (isGuest) {
        const demo = findDemoJobById(jobId!);
        if (!demo) throw new Error("Demo job not found");
        return demo;
      }
      return serverApi.request<Job>(`/api/jobs/${encodeURIComponent(jobId!)}`);
    },
    staleTime: 20 * 1000,
  });
}
