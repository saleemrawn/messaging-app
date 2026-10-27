import { Router } from "express";
import * as controller from "../controllers/user-controllers.ts";

const router = Router();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUser);
router.post("/", controller.userValidators, controller.createUser);

export default router;
