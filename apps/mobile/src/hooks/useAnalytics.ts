import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serverApi } from "../lib/api";

export interface UserStats {
  proposalsSent: number;
  repliesReceived: number;
  projectsWon: number;
  revenueWon: number;
  winRate: number;
  replyRate: number;
}

export interface MonthlyData {
  month: string;
  sent: number;
  replied: number;
  won: number;
}

export interface PlatformData {
  platform: string;
  count: number;
  percentage: string;
  winRate: string;
  color: string;
}

export interface AIInsight {
  type: "positive" | "warning" | "suggestion";
  text: string;
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => serverApi.request<UserStats>("/api/analytics/overview"),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsMonthly() {
  return useQuery({
    queryKey: ["analytics", "monthly"],
    queryFn: () =>
      serverApi.request<MonthlyData[]>("/api/analytics/monthly"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsPlatforms() {
  return useQuery({
    queryKey: ["analytics", "platforms"],
    queryFn: () =>
      serverApi.request<PlatformData[]>("/api/analytics/platforms"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsInsights() {
  return useQuery({
    queryKey: ["analytics", "insights"],
    queryFn: () =>
      serverApi.request<AIInsight[]>("/api/analytics/insights"),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useRefreshAllAnalytics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["analytics", "overview"] }),
        qc.refetchQueries({ queryKey: ["analytics", "monthly"] }),
        qc.refetchQueries({ queryKey: ["analytics", "platforms"] }),
        qc.refetchQueries({ queryKey: ["analytics", "insights"] }),
      ]);
    },
  });
}
