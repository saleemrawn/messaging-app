import { Router } from "express";
import {
  getUsers,
  getUserById,
  lookupUser,
  createUser,
  updateUser,
  deleteUser,
} from "./user-controllers.ts";
import {
  createUserValidators,
  updateUserValidators,
  deleteUserValidators,
  getUserByIdValidators,
  lookupUserValidators,
} from "./user-validators.ts";
import {
  requireOwnAccount,
  uploadAvatar,
  removeAvatar,
} from "../avatar/avatar-controllers.ts";
import { userAvatarValidators } from "../avatar/avatar-validators.ts";
import { parseAvatarUpload } from "../avatar/avatar-upload-middleware.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import { requireAuth } from "../auth/require-auth.ts";
import {
  accountRateLimit,
  avatarUploadRateLimit,
  signupRateLimit,
} from "../rate-limit/rate-limit-middleware.ts";

const router = Router();

// Public: new users sign up before they have a token
router.post(
  "/",
  signupRateLimit,
  createUserValidators,
  handleValidationErrors,
  createUser,
);

router.use(requireAuth, accountRateLimit);
router.get("/", getUsers);
// Before "/:id", whose integer validator would reject "lookup".
router.get("/lookup", lookupUserValidators, handleValidationErrors, lookupUser);
router.get("/:id", getUserByIdValidators, handleValidationErrors, getUserById);
router.put("/:id", updateUserValidators, handleValidationErrors, updateUser);
router.delete("/:id", deleteUserValidators, handleValidationErrors, deleteUser);
// Ownership is checked before the upload is parsed.
router.put(
  "/:id/avatar",
  userAvatarValidators,
  handleValidationErrors,
  requireOwnAccount,
  avatarUploadRateLimit,
  parseAvatarUpload,
  uploadAvatar,
);
router.delete(
  "/:id/avatar",
  userAvatarValidators,
  handleValidationErrors,
  requireOwnAccount,
  removeAvatar,
);

export default router;
