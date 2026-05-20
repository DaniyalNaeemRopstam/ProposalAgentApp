"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";

export type IntegrationsPlatformRow = {
  platform: string;
  totalJobs: number;
  averageScore: number;
  lastFetched?: string | null;
  jobsFetchedToday?: number;
};

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

export type PlatformsResponse = {
  platforms: Array<{
    id: string;
    name: string;
    enabled: boolean;
    type: string;
    description: string;
  }>;
  totalEnabled: number;
};

export function useIntegrationsStatus(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: ["integrations", "status"],
    enabled,
    queryFn: async (): Promise<IntegrationsStatus> => {
      const res = await fetch(apiUrl("/api/integrations/status"), {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Failed to load integration status");
      }
      const raw = await res.json();
      return parseEnvelope<IntegrationsStatus>(raw);
    },
    staleTime: 60 * 1000,
  });
}

export function useIntegrationsPlatforms() {
  return useQuery({
    queryKey: ["integrations", "platforms"],
    queryFn: async (): Promise<PlatformsResponse> => {
      const res = await fetch(apiUrl("/api/integrations/platforms"), {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Failed to load platforms");
      }
      const raw = await res.json();
      return parseEnvelope<PlatformsResponse>(raw);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyncIntegrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/api/integrations/sync"), {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Sync failed");
      }
      const raw = await res.json();
      return parseEnvelope<{
        success: boolean;
        message: string;
        stats: {
          lastRun: string;
          jobsFetched: number;
          newJobsAdded: number;
          hotJobsFound: number;
          errors: string[];
        };
      }>(raw);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useSaveRapidApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rapidApiKey: string) => {
      const res = await fetch(apiUrl("/api/integrations/rapidapi-key"), {
        method: "PUT",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ rapidApiKey }),
      });
      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Failed to save key");
      }
      const raw = (await res.json()) as { success?: boolean };
      return raw;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
}
