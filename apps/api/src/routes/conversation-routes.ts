import { Router } from "express";
import * as controller from "../controllers/conversation-controllers.ts";

const router = Router();

router.get(
  "/",
  controller.getConversationsByUserAccountIdValidators,
  controller.getConversationsByUserAccountId,
);

router.get(
  "/:id",
  controller.getConversationByIdValidators,
  controller.getConversationById,
);

router.post(
  "/",
  controller.createConversationValidators,
  controller.createConversation,
);

router.delete(
  "/:id",
  controller.deleteConversationValidators,
  controller.deleteConversation,
);

router.post(
  "/:id/messages",
  controller.addMessageToConversationValidators,
  controller.addMessageToConversation,
);

router.post(
  "/:id/messages/receipts",
  controller.addMessageReceiptsValidators,
  controller.addMessageReceipts,
);

export default router;
