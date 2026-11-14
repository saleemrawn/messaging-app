import { Router } from "express";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import {
  getConversationsByUserAccountIdValidators,
  getConversationByIdValidators,
  deleteConversationValidators,
  createConversationValidators,
  addMessageToConversationValidators,
  addMessageReceiptsValidators,
} from "./conversation-validators.ts";
import {
  getConversationsByUserAccountId,
  getConversationById,
  createConversation,
  deleteConversation,
  addMessageToConversation,
  addMessageReceipts,
} from "./conversation-controllers.ts";

const router = Router();

router.get(
  "/",
  getConversationsByUserAccountIdValidators,
  handleValidationErrors,
  getConversationsByUserAccountId,
);

router.get(
  "/:id",
  getConversationByIdValidators,
  handleValidationErrors,
  getConversationById,
);

router.post(
  "/",
  createConversationValidators,
  handleValidationErrors,
  createConversation,
);

router.delete(
  "/:id",
  deleteConversationValidators,
  handleValidationErrors,
  deleteConversation,
);

router.post(
  "/:id/messages",
  addMessageToConversationValidators,
  handleValidationErrors,
  addMessageToConversation,
);

router.post(
  "/:id/messages/receipts",
  addMessageReceiptsValidators,
  handleValidationErrors,
  addMessageReceipts,
);

export default router;
