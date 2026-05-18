import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEMO_ANALYTICS_INSIGHTS,
  DEMO_ANALYTICS_MONTHLY,
  DEMO_ANALYTICS_OVERVIEW,
  DEMO_ANALYTICS_PLATFORMS,
} from "@proposalagent/shared";
import { useAuth } from "../context/AuthContext";
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
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "overview", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest
        ? Promise.resolve(DEMO_ANALYTICS_OVERVIEW)
        : serverApi.request<UserStats>("/api/analytics/overview"),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsMonthly() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "monthly", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest
        ? Promise.resolve(DEMO_ANALYTICS_MONTHLY)
        : serverApi.request<MonthlyData[]>("/api/analytics/monthly"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsPlatforms() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "platforms", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest
        ? Promise.resolve(DEMO_ANALYTICS_PLATFORMS)
        : serverApi.request<PlatformData[]>("/api/analytics/platforms"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsInsights() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "insights", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest
        ? Promise.resolve(DEMO_ANALYTICS_INSIGHTS)
        : serverApi.request<AIInsight[]>("/api/analytics/insights"),
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
