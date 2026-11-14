import { Router } from "express";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import * as validator from "./conversation-validators.ts";
import * as controller from "./conversation-controllers.ts";

const router = Router();

router.get(
  "/",
  validator.getConversationsByUserAccountIdValidators,
  handleValidationErrors,
  controller.getConversationsByUserAccountId,
);

router.get(
  "/:id",
  validator.getConversationByIdValidators,
  handleValidationErrors,
  controller.getConversationById,
);

router.post(
  "/",
  validator.createConversationValidators,
  handleValidationErrors,
  controller.createConversation,
);

router.delete(
  "/:id",
  validator.deleteConversationValidators,
  handleValidationErrors,
  controller.deleteConversation,
);

router.post(
  "/:id/messages",
  validator.addMessageToConversationValidators,
  handleValidationErrors,
  controller.addMessageToConversation,
);

router.post(
  "/:id/messages/receipts",
  validator.addMessageReceiptsValidators,
  handleValidationErrors,
  controller.addMessageReceipts,
);

export default router;
