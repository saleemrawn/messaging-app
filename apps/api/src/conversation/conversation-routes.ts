import { Router } from "express";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import {
  getConversationByIdValidators,
  deleteConversationValidators,
  createConversationValidators,
  addMessageToConversationValidators,
  addMessageReceiptsValidators,
  unarchiveConversationValidators,
} from "./conversation-validators.ts";
import {
  getConversationsByUserAccountId,
  getUnreadCount,
  getArchivedConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  addMessageToConversation,
  addMessageReceipts,
  unarchiveConversation,
} from "./conversation-controllers.ts";
import { requireAuth } from "../auth/require-auth.ts";

const router = Router();

router.use(requireAuth);
router.get("/", getConversationsByUserAccountId);
// Before "/:id", whose integer validator would reject these static segments.
router.get("/unread-count", getUnreadCount);
router.get("/archived", getArchivedConversations);
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
  "/:id/unarchive",
  unarchiveConversationValidators,
  handleValidationErrors,
  unarchiveConversation,
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
