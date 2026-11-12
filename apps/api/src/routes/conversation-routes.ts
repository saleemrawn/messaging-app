import { Router } from "express";
import { handleValidationErrors } from "../middleware/validation-error.ts";
import * as controller from "../controllers/conversation-controllers.ts";

const router = Router();

router.get(
  "/",
  controller.getConversationsByUserAccountIdValidators,
  handleValidationErrors,
  controller.getConversationsByUserAccountId,
);

router.get(
  "/:id",
  controller.getConversationByIdValidators,
  handleValidationErrors,
  controller.getConversationById,
);

router.post(
  "/",
  controller.createConversationValidators,
  handleValidationErrors,
  controller.createConversation,
);

router.delete(
  "/:id",
  controller.deleteConversationValidators,
  handleValidationErrors,
  controller.deleteConversation,
);

router.post(
  "/:id/messages",
  controller.addMessageToConversationValidators,
  handleValidationErrors,
  controller.addMessageToConversation,
);

router.post(
  "/:id/messages/receipts",
  controller.addMessageReceiptsValidators,
  handleValidationErrors,
  controller.addMessageReceipts,
);

export default router;
