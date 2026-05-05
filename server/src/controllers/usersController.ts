import type { Request, Response } from "express";
import type { z } from "zod";
import { User } from "../models/User";
import type { pushTokenBodySchema } from "../schemas/userSchemas";
import { ok } from "../utils/ApiResponse";

export async function registerPushToken(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof pushTokenBodySchema>;

  await User.updateOne(
    { _id: req.user!._id },
    { $set: { pushToken: body.pushToken.trim() } }
  );

  res.json(ok({ saved: true }));
}
