import { Router } from "express";
import { getAvatar } from "./avatar-controllers.ts";
import { getAvatarValidators } from "./avatar-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";

const router = Router();

// Public, like most messaging apps' avatars: upload URLs carry a content hash,
// so they can't be guessed or enumerated, and they need no login cookie, so
// they load from any site or CDN. Only seed file names are guessable.
router.get(
  "/:fileName",
  getAvatarValidators,
  handleValidationErrors,
  getAvatar,
);

export default router;
