import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serverApi } from "../lib/api";

interface IntegrationStats {
  lastRun: string | null;
  lastStats: {
    newJobsAdded: number;
    hotJobsFound: number;
    jobsFetched: number;
  } | null;
}

interface IntegrationsStatus {
  aggregation: IntegrationStats;
  lastUpdate: string;
}

interface SyncResult {
  message: string;
  stats: {
    lastRun: string;
    jobsFetched: number;
    newJobsAdded: number;
    hotJobsFound: number;
    errors: string[];
  };
}

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ["integrations", "status"],
    queryFn: async (): Promise<IntegrationsStatus> => {
      return serverApi.request<IntegrationsStatus>("/api/integrations/status");
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useSyncIntegrations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      return serverApi.request<SyncResult>("/api/integrations/sync", {
        method: "POST",
      });
    },
    onSuccess: () => {
      // Invalidate and refetch jobs and integration status
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["integrations", "status"] });
    },
    onError: (error) => {
      console.error("Sync failed:", error);
    },
  });
}