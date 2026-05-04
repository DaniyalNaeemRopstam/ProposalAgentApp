import { Router } from "express";
import {
  addProjectLibrary,
  getMe,
  login,
  register,
  removeProjectLibrary,
  saveVoiceProfile,
  updateProfile,
} from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  loginBodySchema,
  profileUpdateBodySchema,
  projectLibraryIdParamSchema,
  projectLibraryItemBodySchema,
  registerBodySchema,
  voiceProfileBodySchema,
} from "../schemas/authSchemas";

export const authRouter = Router();

authRouter.post("/register", validate(registerBodySchema), asyncHandler(register));

authRouter.post("/login", validate(loginBodySchema), asyncHandler(login));

authRouter.get("/me", requireAuth, asyncHandler(getMe));

authRouter.put("/profile", requireAuth, validate(profileUpdateBodySchema), asyncHandler(updateProfile));

authRouter.post(
  "/voice-profile",
  requireAuth,
  validate(voiceProfileBodySchema),
  asyncHandler(saveVoiceProfile)
);

authRouter.post(
  "/project-library",
  requireAuth,
  validate(projectLibraryItemBodySchema),
  asyncHandler(addProjectLibrary)
);

authRouter.delete(
  "/project-library/:id",
  requireAuth,
  validate(projectLibraryIdParamSchema, "params"),
  asyncHandler(removeProjectLibrary)
);
