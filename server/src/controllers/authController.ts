import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User";
import {
  loginBodySchema,
  profileUpdateBodySchema,
  projectLibraryIdParamSchema,
  projectLibraryItemBodySchema,
  registerBodySchema,
  voiceProfileBodySchema,
} from "../schemas/authSchemas";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/ApiResponse";
import type { z } from "zod";

const BCRYPT_COST = 12;
const JWT_EXPIRES = "30d";
const VOICE_SAMPLE_SEPARATOR = "\n---\n";

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET is not set");
  }
  return s;
}

export function signAuthToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, jwtSecret(), { expiresIn: JWT_EXPIRES });
}

const defaultStats = (): {
  proposalsSent: number;
  repliesReceived: number;
  projectsWon: number;
  revenueWon: number;
  winRate: number;
  replyRate: number;
} => ({
  proposalsSent: 0,
  repliesReceived: 0,
  projectsWon: 0,
  revenueWon: 0,
  winRate: 0,
  replyRate: 0,
});

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof registerBodySchema>;

  const existing = await User.findOne({ email: body.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);

  try {
    const user = await User.create({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      passwordHash,
      companyName: body.companyName.trim(),
      plan: "free",
      stats: defaultStats(),
      projectLibrary: [],
    });

    const token = signAuthToken(user.id, user.email);
    res.status(201).json(
      ok({
        token,
        user: user.toJSON(),
      })
    );
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw ApiError.conflict("An account with this email already exists.");
    }
    throw err;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof loginBodySchema>;

  const user = await User.findOne({ email: body.email.toLowerCase().trim() }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const match = await bcrypt.compare(body.password, user.passwordHash);
  if (!match) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const token = signAuthToken(user.id, user.email);
  res.json(ok({ token, user: user.toJSON() }));
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw ApiError.unauthorized("Account could not be found. Please sign in again.");
  }
  res.json(ok(user.toJSON()));
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof profileUpdateBodySchema>;

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw ApiError.unauthorized("Account could not be found. Please sign in again.");
  }

  if (body.name !== undefined) user.name = body.name.trim();
  if (body.companyName !== undefined) user.companyName = body.companyName.trim();
  if (body.avatar !== undefined) user.avatar = body.avatar;
  if (body.voiceProfile !== undefined) user.voiceProfile = body.voiceProfile;

  await user.save();
  res.json(ok(user.toJSON()));
}

export async function saveVoiceProfile(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof voiceProfileBodySchema>;

  const combined = body.sampleProposals.map((s) => s.trim()).join(VOICE_SAMPLE_SEPARATOR);

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: { voiceProfile: combined } },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw ApiError.unauthorized("Account could not be found. Please sign in again.");
  }

  res.json(ok({ voiceProfile: user.voiceProfile }, "Voice profile saved"));
}

export async function addProjectLibrary(req: Request, res: Response): Promise<void> {
  const body = req.validated as z.infer<typeof projectLibraryItemBodySchema>;

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw ApiError.unauthorized("Account could not be found. Please sign in again.");
  }

  user.projectLibrary.push({
    title: body.title.trim(),
    client: body.client.trim(),
    outcome: body.outcome.trim(),
    stack: body.stack,
    budget: body.budget.trim(),
  });

  await user.save();

  res.status(201).json(ok({ projectLibrary: user.projectLibrary }));
}

export async function removeProjectLibrary(req: Request, res: Response): Promise<void> {
  const { id } = req.validated as z.infer<typeof projectLibraryIdParamSchema>;
  const oid = new mongoose.Types.ObjectId(id);

  const updated = await User.findOneAndUpdate(
    { _id: req.user!._id, "projectLibrary._id": oid },
    { $pull: { projectLibrary: { _id: oid } } },
    { new: true }
  );

  if (!updated) {
    throw ApiError.notFound("Project not found in your library.");
  }

  res.json(ok({ projectLibrary: updated.projectLibrary }));
}
