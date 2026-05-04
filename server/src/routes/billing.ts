import { Router } from "express";
import {
  billingStatus,
  createCheckout,
  createPortal,
  stripeWebhook,
} from "../controllers/billingController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createCheckoutBodySchema,
  portalBodySchema,
} from "../schemas/billingSchemas";
import { asyncHandler } from "../utils/asyncHandler";

export const billingRouter = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * Stripe sends this with Content-Type: application/json but the body must
 * arrive as a raw Buffer for signature verification.
 * express.raw() is mounted in index.ts BEFORE express.json(), so req.body
 * is already a Buffer by the time this handler runs.
 */
billingRouter.post("/webhook", asyncHandler(stripeWebhook));

// ─── Protected ────────────────────────────────────────────────────────────────

billingRouter.use(requireAuth);

billingRouter.get("/status", asyncHandler(billingStatus));

billingRouter.post(
  "/create-checkout",
  validate(createCheckoutBodySchema),
  asyncHandler(createCheckout)
);

billingRouter.post(
  "/portal",
  validate(portalBodySchema),
  asyncHandler(createPortal)
);
