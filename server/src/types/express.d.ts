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
    }
  }
}

export {};
