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
import { requireAuth } from "../auth/require-auth.ts";

const router = Router();

router.get(
  "/",
  requireAuth,
  getConversationsByUserAccountIdValidators,
  handleValidationErrors,
  getConversationsByUserAccountId,
);

router.get(
  "/:id",
  requireAuth,
  getConversationByIdValidators,
  handleValidationErrors,
  getConversationById,
);

router.post(
  "/",
  requireAuth,
  createConversationValidators,
  handleValidationErrors,
  createConversation,
);

router.delete(
  "/:id",
  requireAuth,
  deleteConversationValidators,
  handleValidationErrors,
  deleteConversation,
);

router.post(
  "/:id/messages",
  requireAuth,
  addMessageToConversationValidators,
  handleValidationErrors,
  addMessageToConversation,
);

router.post(
  "/:id/messages/receipts",
  requireAuth,
  addMessageReceiptsValidators,
  handleValidationErrors,
  addMessageReceipts,
);

export default router;
