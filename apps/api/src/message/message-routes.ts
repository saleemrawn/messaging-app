import { Router } from "express";
import { deleteMessage } from "./message-controllers.ts";
import { deleteMessageValidators } from "./message-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import { requireAuth } from "../auth/require-auth.ts";
import { accountRateLimit } from "../rate-limit/rate-limit-middleware.ts";

const router = Router();

router.use(requireAuth, accountRateLimit);
router.delete(
  "/:id",
  deleteMessageValidators,
  handleValidationErrors,
  deleteMessage,
);

export default router;
