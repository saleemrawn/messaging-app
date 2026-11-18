import { Router } from "express";
import { deleteMessage } from "./message-controllers.ts";
import { deleteMessageValidators } from "./message-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import { requireAuth } from "../auth/require-auth.ts";

const router = Router();

router.use(requireAuth);
router.delete(
  "/:id",
  deleteMessageValidators,
  handleValidationErrors,
  deleteMessage,
);

export default router;
