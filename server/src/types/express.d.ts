import type { Types } from "mongoose";

export type AuthUserPayload = {
  _id: Types.ObjectId;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      /** Set by `validate()` middleware */
      validated?: unknown;
      /** Set by `proposalGuard`: remaining free generations BEFORE this POST /generate succeeds (paid → null). */
      proposalsRemaining?: number | null;
      /** Billing plan resolved in `proposalGuard` for `/generate` response meta. */
      proposalBillingPlan?: "free" | "solo" | "pro" | "enterprise";
    }
  }
}

export {};
