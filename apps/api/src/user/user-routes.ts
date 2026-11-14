import { Router } from "express";
import * as controller from "./user-controllers.ts";
import {
  createUserValidators,
  updateUserValidators,
  deleteUserValidators,
} from "./user-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";

const router = Router();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUserById);
router.post(
  "/",
  createUserValidators,
  handleValidationErrors,
  controller.createUser,
);
router.put(
  "/:id",
  updateUserValidators,
  handleValidationErrors,
  controller.updateUser,
);
router.delete(
  "/:id",
  deleteUserValidators,
  handleValidationErrors,
  controller.deleteUser,
);

export default router;
