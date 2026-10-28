import { Router } from "express";
import * as controller from "../controllers/user-controllers.ts";

const router = Router();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUser);
router.post("/", controller.createUserValidators, controller.createUser);
router.put("/:id", controller.updateUserValidators, controller.updateUser);
router.delete("/:id", controller.deleteUserValidators, controller.deleteUser);

export default router;
