import { Router } from "express";
import * as controller from "../controllers/conversation-controllers.ts";

const router = Router();

router.post(
  "/",
  controller.createConversationValidators,
  controller.createConversation,
);

export default router;
