"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";

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
  if (!res.ok) throw new Error("Failed to fetch analytics overview");
  const raw = await res.json();
  return parseEnvelope<UserStats>(raw);
}

async function fetchAnalyticsMonthly(): Promise<MonthlyData[]> {
  const res = await fetch(apiUrl("/api/analytics/monthly"), {
    credentials: "include", 
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch monthly analytics");
  const raw = await res.json();
  return parseEnvelope<MonthlyData[]>(raw);
}

async function fetchAnalyticsPlatforms(): Promise<PlatformData[]> {
  const res = await fetch(apiUrl("/api/analytics/platforms"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch platform analytics");
  const raw = await res.json();
  return parseEnvelope<PlatformData[]>(raw);
}

async function fetchAnalyticsInsights(): Promise<AIInsight[]> {
  const res = await fetch(apiUrl("/api/analytics/insights"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch AI insights");
  const raw = await res.json();
  return parseEnvelope<AIInsight[]>(raw);
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: fetchAnalyticsOverview,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAnalyticsMonthly() {
  return useQuery({
    queryKey: ["analytics", "monthly"],
    queryFn: fetchAnalyticsMonthly,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAnalyticsPlatforms() {
  return useQuery({
    queryKey: ["analytics", "platforms"],
    queryFn: fetchAnalyticsPlatforms,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAnalyticsInsights() {
  return useQuery({
    queryKey: ["analytics", "insights"],
    queryFn: fetchAnalyticsInsights,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (matches server cache)
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