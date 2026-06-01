"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";

export type BillingPlan = "free" | "solo" | "pro" | "enterprise";

export interface BillingStatus {
  plan: BillingPlan;
  proposalsUsedThisMonth: number;
  proposalsUsedLifetime?: number;
  proposalsUsedForUi?: number;
  proposalsLimit: number | null; // null = unlimited
  proposalsLimitIsLifetime?: boolean;
  unlimited?: boolean;
  nextReset: string; // ISO date
}

async function fetchBillingStatus(): Promise<BillingStatus> {
  const res = await fetch(apiUrl("/api/billing/status"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch billing status");
  const raw = await res.json();
  return parseEnvelope<BillingStatus>(raw);
}

export function useBillingStatus() {
  return useQuery({
    queryKey: ["billing", "status"],
    queryFn: fetchBillingStatus,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (plan: Exclude<BillingPlan, "free">) => {
      const res = await fetch(apiUrl("/api/billing/create-checkout"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to create checkout";
        throw new Error(message);
      }
      const raw = await res.json();
      const data = parseEnvelope<{ checkoutUrl: string }>(raw);
      return data.checkoutUrl;
    },
  });
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      const res = await fetch(apiUrl("/api/billing/portal"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ 
          returnUrl: returnUrl || `${window.location.origin}/settings?tab=billing`
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to create portal session";
        throw new Error(message);
      }
      const raw = await res.json();
      const data = parseEnvelope<{ portalUrl: string }>(raw);
      return data.portalUrl;
    },
  });
}

// Plan configuration data (matches server-side definitions)
export const PLAN_CONFIGS = {
  free: {
    name: "Free",
    price: 0,
    proposalsPerMonth: 3,
    platforms: ["Upwork"],
    features: ["3 free AI proposals", "Upwork only", "Basic job scoring"],
  },
  solo: {
    name: "Solo", 
    price: 49,
    proposalsPerMonth: null,
    platforms: ["Upwork", "LinkedIn", "Email", "Fiverr", "Toptal"],
    features: [
      "Unlimited proposals",
      "All platforms", 
      "Follow-up sequences",
      "Analytics",
      "AI job scoring",
    ],
  },
  pro: {
    name: "Pro",
    price: 149,
    proposalsPerMonth: null,
    platforms: ["Upwork", "LinkedIn", "Email", "Fiverr", "Toptal", "Direct"],
    features: [
      "Everything in Solo",
      "3 seats",
      "Cold email outreach", 
      "CRM pipeline",
      "Contracts",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    proposalsPerMonth: null,
    platforms: ["All platforms", "API access", "White-label"],
    features: [
      "Everything in Pro",
      "10 seats",
      "API access",
      "White-label",
      "Priority support",
    ],
  },
} as const;