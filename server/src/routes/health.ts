import { Router } from "express";
import { ok } from "../utils/ApiResponse";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(ok({ ok: true, service: "proposalagent-api" }));
});
