import { Router } from "express";
import { registerPushToken } from "../controllers/usersController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { pushTokenBodySchema } from "../schemas/userSchemas";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.post(
  "/push-token",
  validate(pushTokenBodySchema),
  asyncHandler(registerPushToken)
);
