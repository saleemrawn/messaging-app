import { Router } from "express";
import * as controller from "../controllers/message-controllers.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";

const router = Router();

router.delete(
  "/:id",
  controller.deleteMessageValidators,
  handleValidationErrors,
  controller.deleteMessage,
);

export default router;
