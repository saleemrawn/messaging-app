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

router.post(
  "/:id/messages",
  controller.addMessageToConversationValidators,
  controller.addMessageToConversation,
);

export default router;
