"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DEMO_ANALYTICS_INSIGHTS,
  DEMO_ANALYTICS_MONTHLY,
  DEMO_ANALYTICS_OVERVIEW,
  DEMO_ANALYTICS_PLATFORMS,
} from "@proposalagent/shared";
import { useAuth } from "@/context/AuthContext";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";

// User stats from overview endpoint
export interface UserStats {
  proposalsSent: number;
  repliesReceived: number;
  projectsWon: number;
  revenueWon: number;
  winRate: number;
  replyRate: number;
}

// Monthly aggregation data
export interface MonthlyData {
  month: string;
  sent: number;
  replied: number;
  won: number;
}

// Platform breakdown data
export interface PlatformData {
  platform: string;
  count: number;
  percentage: string;
  winRate: string;
  color: string;
}

// AI insights from Claude
export interface AIInsight {
  type: "positive" | "warning" | "suggestion";
  text: string;
}

async function fetchAnalyticsOverview(): Promise<UserStats> {
  const res = await fetch(apiUrl("/api/analytics/overview"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    await notifyHttpError(res);
    throw new Error("Failed to fetch analytics overview");
  }
  const raw = await res.json();
  return parseEnvelope<UserStats>(raw);
}

async function fetchAnalyticsMonthly(): Promise<MonthlyData[]> {
  const res = await fetch(apiUrl("/api/analytics/monthly"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    await notifyHttpError(res);
    throw new Error("Failed to fetch monthly analytics");
  }
  const raw = await res.json();
  return parseEnvelope<MonthlyData[]>(raw);
}

async function fetchAnalyticsPlatforms(): Promise<PlatformData[]> {
  const res = await fetch(apiUrl("/api/analytics/platforms"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    await notifyHttpError(res);
    throw new Error("Failed to fetch platform analytics");
  }
  const raw = await res.json();
  return parseEnvelope<PlatformData[]>(raw);
}

async function fetchAnalyticsInsights(): Promise<AIInsight[]> {
  const res = await fetch(apiUrl("/api/analytics/insights"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    await notifyHttpError(res);
    throw new Error("Failed to fetch AI insights");
  }
  const raw = await res.json();
  return parseEnvelope<AIInsight[]>(raw);
}

export function useAnalyticsOverview() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "overview", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest ? Promise.resolve(DEMO_ANALYTICS_OVERVIEW) : fetchAnalyticsOverview(),
    staleTime: 60 * 1000,
  });
}

export function useAnalyticsMonthly() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "monthly", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest ? Promise.resolve(DEMO_ANALYTICS_MONTHLY) : fetchAnalyticsMonthly(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsPlatforms() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "platforms", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest ? Promise.resolve(DEMO_ANALYTICS_PLATFORMS) : fetchAnalyticsPlatforms(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsInsights() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["analytics", "insights", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest ? Promise.resolve(DEMO_ANALYTICS_INSIGHTS) : fetchAnalyticsInsights(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useRefreshInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchAnalyticsInsights,
    onSuccess: (data) => {
      queryClient.setQueryData(["analytics", "insights"], data);
    },
  });
}
