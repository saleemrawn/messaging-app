import { Router } from "express";
import { deleteMessage } from "./message-controllers.ts";
import { deleteMessageValidators } from "./message-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";

const router = Router();

router.delete(
  "/:id",
  deleteMessageValidators,
  handleValidationErrors,
  deleteMessage,
);

export default router;
