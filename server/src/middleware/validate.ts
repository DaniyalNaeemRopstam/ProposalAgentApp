import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export type ValidatedPart = "body" | "query" | "params";

/**
 * Validates `req.body` / `req.query` / `req.params` with a Zod schema.
 *
 * Result is shallow-merged into `req.validated` so multiple validate() calls
 * in a chain (e.g. params + body) accumulate correctly.
 */
export function validate<T>(schema: ZodSchema<T>, part: ValidatedPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = part === "body" ? req.body : part === "query" ? req.query : req.params;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const message = parsed.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      next(ApiError.badRequest(message));
      return;
    }
    const prev = (req as Request & { validated?: Record<string, unknown> }).validated ?? {};
    (req as Request & { validated: Record<string, unknown> }).validated = {
      ...prev,
      ...(parsed.data as Record<string, unknown>),
    };
    next();
  };
}
