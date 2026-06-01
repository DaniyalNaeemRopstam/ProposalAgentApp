import type { Request, Response } from "express";
import type Stripe from "stripe";
import type { z } from "zod";
import { Proposal } from "../models/Proposal";
import { User } from "../models/User";
import type { createCheckoutBodySchema, portalBodySchema } from "../schemas/billingSchemas";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/ApiResponse";
import {
  type BillingPlan,
  FREE_PROPOSAL_LIFETIME_LIMIT,
  PLAN_CONFIGS,
  STRIPE_PRICE_IDS,
  getStripe,
  getWebhookSecret,
} from "../utils/stripe";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function webAppUrl(): string {
  const explicit =
    process.env.APP_WEB_URL?.trim() ||
    process.env.WEB_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!explicit) {
      throw new ApiError(500, "APP_WEB_URL must be set in production (your live dashboard URL).");
    }
    return explicit.replace(/\/$/, "");
  }

  return (explicit ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Start of current month in UTC. */
function monthStart(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Start of next month in UTC. */
function nextMonthStart(): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1, 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── POST /api/billing/create-checkout ───────────────────────────────────────

export async function createCheckout(req: Request, res: Response): Promise<void> {
  const { plan } = req.validated as z.infer<typeof createCheckoutBodySchema>;
  const stripe = getStripe();

  const user = await User.findById(req.user!._id).lean();
  if (!user) throw ApiError.unauthorized("Account not found.");

  // Idempotent: create Stripe customer on first checkout
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: req.user!._id.toString() },
    });
    customerId = customer.id;
    await User.updateOne({ _id: req.user!._id }, { $set: { stripeCustomerId: customer.id } });
  }

  const priceId = STRIPE_PRICE_IDS[plan];
  const base = webAppUrl();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/proposals?billing=success&plan=${plan}`,
    cancel_url: `${base}/dashboard/proposals?billing=cancelled`,
    subscription_data: {
      metadata: { userId: req.user!._id.toString(), plan },
    },
    metadata: { userId: req.user!._id.toString(), plan },
    allow_promotion_codes: true,
  });

  res.json(ok({ checkoutUrl: session.url }));
}

// ─── POST /api/billing/portal ─────────────────────────────────────────────────

export async function createPortal(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof portalBodySchema>;
  const stripe = getStripe();

  const user = await User.findById(req.user!._id).lean();
  if (!user) throw ApiError.unauthorized("Account not found.");
  if (!user.stripeCustomerId) {
    throw ApiError.badRequest(
      "No billing account found. Please subscribe to a plan first."
    );
  }

  const base = webAppUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: body.returnUrl ?? `${base}/dashboard?section=billing`,
  });

  res.json(ok({ portalUrl: session.url }));
}

// ─── POST /api/billing/webhook ────────────────────────────────────────────────

/** Map Stripe price ID → our plan key. */
function planFromPriceId(priceId: string): BillingPlan | null {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) return plan as BillingPlan;
  }
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  if (!subscriptionId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const resolved = priceId ? planFromPriceId(priceId) : null;
  const plan: BillingPlan = resolved ?? "free";

  await User.updateOne(
    { _id: userId },
    { $set: { plan, stripeCustomerId: session.customer as string } }
  );

  console.info(`[billing] User ${userId} upgraded to plan "${plan}"`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await User.updateOne({ _id: userId }, { $set: { plan: "free" } });
  console.info(`[billing] Subscription deleted — user ${userId} downgraded to free`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Phase 2: send notification email via SendGrid / Resend
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  console.warn(
    `[billing] Payment failed for customer ${customerId ?? "unknown"} — ` +
      `amount: ${invoice.amount_due} ${invoice.currency}`
  );
}

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body as Buffer,
      sig,
      getWebhookSecret()
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[billing] Webhook signature error:", msg);
    res.status(400).json({ error: msg });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Unhandled event types are silently acknowledged
        break;
    }
  } catch (err) {
    console.error(`[billing] Error processing event ${event.type}:`, err);
    res.status(500).json({ error: "Webhook handler error" });
    return;
  }

  res.json({ received: true });
}

// ─── GET /api/billing/status ─────────────────────────────────────────────────

export async function billingStatus(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!._id).lean();
  if (!user) throw ApiError.unauthorized("Account not found.");

  const plan = (user.plan ?? "free") as BillingPlan;
  const config = PLAN_CONFIGS[plan];
  const limit = config.proposalsPerMonth; // null = unlimited

  // Free: lifetime count from profile; paid unlimited: still expose monthly non-draft count for dashboards
  const proposalsUsedLifetime = user.stats?.proposalsSent ?? 0;

  const proposalsUsedThisMonth = await Proposal.countDocuments({
    userId: req.user!._id,
    status: { $nin: ["draft"] },
    createdAt: { $gte: monthStart() },
  });

  const isFree = plan === "free";
  const proposalsLimitForUi = isFree ? FREE_PROPOSAL_LIFETIME_LIMIT : limit;
  const proposalsUsedForUi = isFree ? proposalsUsedLifetime : proposalsUsedThisMonth;

  res.json(
    ok({
      plan,
      planConfig: {
        name: config.name,
        price: config.price,
        features: config.features,
        platforms: config.platforms,
      },
      proposalsUsedThisMonth,
      proposalsUsedLifetime,
      proposalsUsedForUi,
      proposalsLimit: proposalsLimitForUi,
      proposalsLimitIsLifetime: isFree,
      unlimited: !isFree && limit === null,
      nextReset: nextMonthStart().toISOString(),
      hasStripeCustomer: Boolean(user.stripeCustomerId),
    })
  );
}
