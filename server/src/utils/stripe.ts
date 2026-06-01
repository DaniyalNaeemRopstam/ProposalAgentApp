import Stripe from "stripe";

// ─── Plan definitions ─────────────────────────────────────────────────────────

export type BillingPlan = "free" | "solo" | "pro" | "enterprise";

export interface PlanConfig {
  name: string;
  price: number; // USD/month
  proposalsPerMonth: number | null; // null = unlimited
  platforms: string[];
  features: string[];
  stripePriceId: string;
}

/** Free tier: lifetime AI proposal generations (see `proposalGuard`, `totalProposalsGenerated`). */
export const FREE_PROPOSAL_LIFETIME_LIMIT = 3;

/** Stripe price IDs — set the real IDs from your Stripe dashboard in .env */
export const STRIPE_PRICE_IDS: Record<Exclude<BillingPlan, "free">, string> = {
  solo: process.env.STRIPE_PRICE_SOLO ?? "price_solo_placeholder",
  pro: process.env.STRIPE_PRICE_PRO ?? "price_pro_placeholder",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise_placeholder",
};

export const PLAN_CONFIGS: Record<BillingPlan, PlanConfig> = {
  free: {
    name: "Free",
    price: 0,
    proposalsPerMonth: FREE_PROPOSAL_LIFETIME_LIMIT,
    platforms: ["upwork"],
    features: ["3 free AI proposals (lifetime)", "Upwork only", "Basic job scoring"],
    stripePriceId: "",
  },
  solo: {
    name: "Solo",
    price: 49,
    proposalsPerMonth: null,
    platforms: ["upwork", "linkedin", "email", "fiverr", "toptal"],
    features: [
      "Unlimited proposals",
      "All platforms",
      "Follow-up sequences",
      "Analytics",
      "AI job scoring",
    ],
    stripePriceId: STRIPE_PRICE_IDS.solo,
  },
  pro: {
    name: "Pro",
    price: 149,
    proposalsPerMonth: null,
    platforms: ["upwork", "linkedin", "email", "fiverr", "toptal", "direct"],
    features: [
      "Everything in Solo",
      "3 seats",
      "Cold email outreach",
      "CRM pipeline",
      "Contracts",
    ],
    stripePriceId: STRIPE_PRICE_IDS.pro,
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    proposalsPerMonth: null,
    platforms: ["upwork", "linkedin", "email", "fiverr", "toptal", "direct", "api"],
    features: [
      "Everything in Pro",
      "10 seats",
      "API access",
      "White-label",
      "Priority support",
    ],
    stripePriceId: STRIPE_PRICE_IDS.enterprise,
  },
};

// ─── Stripe singleton ─────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return _stripe;
}

/** Webhook secret used to verify Stripe event signatures. */
export function getWebhookSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s?.trim()) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return s;
}
