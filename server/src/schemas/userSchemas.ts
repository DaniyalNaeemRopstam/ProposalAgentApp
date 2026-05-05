import { z } from "zod";

/** POST /api/users/push-token */
export const pushTokenBodySchema = z.object({
  pushToken: z.string().min(1).max(512),
});
