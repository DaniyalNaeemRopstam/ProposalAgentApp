"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { cn } from "@/lib/cn";
import { C } from "@/styles/theme";
import {
  useAnalyticsOverview,
  useAnalyticsMonthly,
  useAnalyticsPlatforms,
  useAnalyticsInsights,
  useRefreshInsights,
  type AIInsight,
  type PlatformData,
} from "@/hooks/useAnalytics";
import { AnalyticsSkeleton } from "@/components/skeletons/AnalyticsSkeleton";

// MVP color mapping for platforms
const PLATFORM_COLORS: Record<string, string> = {
  Upwork: C.success,
  LinkedIn: C.accent,
  Wellfound: C.purple,
  Other: C.textMuted,
};

// MVP color mapping for insights
const INSIGHT_COLORS: Record<string, string> = {
  positive: C.success,
  suggestion: C.accent,
  warning: C.warn,
};

const INSIGHT_ICONS: Record<string, "check" | "arrow"> = {
  positive: "check",
  suggestion: "check", 
  warning: "arrow",
};

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-dangerDim/30 p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
        <Icon name="target" size={22} />
      </div>
      <p className="text-sm text-danger">{message}</p>
    </div>
  );
}

function PlatformChart({ platforms }: { platforms: PlatformData[] }) {
  if (platforms.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-textDim">
        No platform data yet
      </div>
    );
  }

  return (
    <>
      {platforms.map((p) => {
        const color = PLATFORM_COLORS[p.platform] || C.textMuted;
        const percentage = parseFloat(p.percentage) || 0;
        
        return (
          <div key={p.platform} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: C.text }}>{p.platform}</span>
              <span style={{ color: C.textMuted }}>{p.count} sent · {p.percentage}%</span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
              <div style={{ 
                height: "100%", 
                width: `${percentage}%`, 
                background: color, 
                borderRadius: 3, 
                transition: "width 1s ease" 
              }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

function TierChart() {
  // Hardcoded MVP budget tiers since server doesn't track proposal variants
  const tiers = [
    { label: "Tier A ($2k–$5k)", rate: 22, color: C.teal },
    { label: "Tier B ($5k–$15k)", rate: 18, color: C.accent },
    { label: "Tier C ($15k–$50k)", rate: 8, color: C.purple },
  ];

  return (
    <>
      {tiers.map((p) => (
        <div key={p.label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ color: C.text }}>{p.label}</span>
            <span style={{ color: p.color, fontWeight: 600 }}>{p.rate}% win rate</span>
          </div>
          <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{ 
              height: "100%", 
              width: `${p.rate * 4}%`, 
              background: p.color, 
              borderRadius: 3, 
              transition: "width 1s ease" 
            }} />
          </div>
        </div>
      ))}
    </>
  );
}

function InsightsSection({ 
  insights, 
  isRefreshing, 
  onRefresh 
}: { 
  insights: AIInsight[]; 
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 text-2xl">🤖</div>
        <p className="mb-4 text-sm text-textMuted">No AI insights available yet</p>
        <Btn variant="primary" className="text-xs" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Generating..." : "Generate insights"}
        </Btn>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 14 
      }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
          AI INSIGHTS — WHAT&apos;S WORKING
        </div>
        <Btn 
          variant="ghost" 
          className="text-xs" 
          onClick={onRefresh} 
          disabled={isRefreshing}
        >
          <Icon name="refresh" size={12} />
          {isRefreshing ? "Refreshing..." : "Refresh insights"}
        </Btn>
      </div>
      
      {insights.map((ins, i) => {
        const color = INSIGHT_COLORS[ins.type] || C.textMuted;
        const iconName = INSIGHT_ICONS[ins.type] || ("check" as const);
        
        return (
          <div key={i} style={{ 
            display: "flex", 
            gap: 10, 
            alignItems: "flex-start", 
            marginBottom: 10, 
            padding: "10px 12px", 
            background: C.bg, 
            borderRadius: 8 
          }}>
            <span style={{ color, flexShrink: 0, marginTop: 1 }}>
              <Icon name={iconName} size={14} />
            </span>
            <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
              {ins.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsTab() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useAnalyticsOverview();
  const { data: monthly, isLoading: monthlyLoading, error: monthlyError } = useAnalyticsMonthly();
  const { data: platforms, isLoading: platformsLoading, error: platformsError } = useAnalyticsPlatforms();
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useAnalyticsInsights();
  
  const refreshInsightsMutation = useRefreshInsights();

  const isLoading = overviewLoading || monthlyLoading || platformsLoading || insightsLoading;
  const hasError = overviewError || monthlyError || platformsError || insightsError;

  if (isLoading) {
    return (
      <div className="animate-slideUp">
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (hasError) {
    const errorMsg = 
      overviewError?.message ||
      monthlyError?.message ||
      platformsError?.message ||
      insightsError?.message ||
      "Failed to load analytics";
    
    return <ErrorState message={errorMsg} />;
  }

  const handleRefreshInsights = () => {
    refreshInsightsMutation.mutate();
  };

  return (
    <div className="animate-slideUp">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontWeight: 500 }}>
            PROPOSALS BY PLATFORM
          </div>
          <PlatformChart platforms={platforms || []} />
        </div>
        
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontWeight: 500 }}>
            WIN RATE BY BUDGET TIER
          </div>
          <TierChart />
        </div>
      </div>
      
      <div className="card" style={{ padding: 20 }}>
        <InsightsSection
          insights={insights || []}
          isRefreshing={refreshInsightsMutation.isPending}
          onRefresh={handleRefreshInsights}
        />
      </div>
    </div>
  );
}