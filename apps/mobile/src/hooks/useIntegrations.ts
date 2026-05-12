import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serverApi } from "../lib/api";

export type IntegrationsPlatformRow = {
  platform: string;
  totalJobs: number;
  averageScore: number;
  lastFetched?: string | null;
  jobsFetchedToday?: number;
};

/** Mirrors `apps/web/src/hooks/useIntegrations.ts` — server returns this shape without a `{ data }` envelope. */
export type IntegrationsStatus = {
  aggregation: {
    lastRun: string | null;
    nextRun: string | null;
    status: string;
    lastStats: {
      lastRun: string;
      jobsFetched: number;
      newJobsAdded: number;
      hotJobsFound: number;
      errors: string[];
    } | null;
  };
  platforms: IntegrationsPlatformRow[];
  summary: {
    totalAggregatedJobs: number;
    recentHighScoreJobs: number;
    connectedPlatforms: string[];
    totalJobsInDatabase?: number;
    jobsAddedThisWeek?: number;
    mostActivePlatform?: string | null;
    averageScoreOfAggregated?: number | null;
    jobsFetchedTodayByPlatform?: Record<string, number>;
  };
};

/** POST /api/integrations/sync returns `{ success, message, stats }` (no envelope). */
export type SyncResponse = {
  success: boolean;
  message: string;
  stats: {
    lastRun: string;
    jobsFetched: number;
    newJobsAdded: number;
    hotJobsFound: number;
    errors: string[];
    backfilled?: number;
  };
};

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ["integrations", "status"],
    queryFn: async (): Promise<IntegrationsStatus> => {
      return serverApi.request<IntegrationsStatus>("/api/integrations/status");
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useSyncIntegrations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      return serverApi.request<SyncResponse>("/api/integrations/sync", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["integrations", "status"] });
    },
    onError: (error) => {
      console.error("Sync failed:", error);
    },
  });
}
