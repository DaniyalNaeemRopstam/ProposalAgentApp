import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET is not set");
  }
  return s;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing bearer token"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next(ApiError.unauthorized("Missing bearer token"));
    return;
  }

  try {
    const payload = jwt.verify(token, getSecret()) as { sub: string; email: string };
    if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
      next(ApiError.unauthorized("Invalid token subject"));
      return;
    }
    req.user = {
      _id: new mongoose.Types.ObjectId(payload.sub),
      email: payload.email,
    };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}
