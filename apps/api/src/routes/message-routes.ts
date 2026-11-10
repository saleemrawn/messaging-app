import { Router } from "express";
import * as controller from "../controllers/message-controllers.ts";

const router = Router();

router.delete(
  "/:id",
  controller.deleteMessageValidators,
  controller.deleteMessage,
);

export default router;
