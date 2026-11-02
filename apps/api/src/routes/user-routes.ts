import { Router } from "express";
import * as controller from "../controllers/user-controllers.ts";

const router = Router();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUserById);
router.post("/", controller.createUserValidators, controller.createUser);
router.put("/:id", controller.updateUserValidators, controller.updateUser);
router.delete("/:id", controller.deleteUserValidators, controller.deleteUser);

export default router;
