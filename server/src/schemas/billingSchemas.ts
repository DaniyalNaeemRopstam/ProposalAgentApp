import { z } from "zod";

export const createCheckoutBodySchema = z.object({
  plan: z.enum(["solo", "pro", "enterprise"], {
    required_error: "plan is required",
    invalid_type_error: "plan must be one of: solo, pro, enterprise",
  }),
});

export const portalBodySchema = z.object({
  returnUrl: z.string().url("returnUrl must be a valid URL").optional(),
});
