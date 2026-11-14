import { Router } from "express";
import * as controller from "./user-controllers.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";

const router = Router();

router.get("/", controller.getUsers);
router.get("/:id", controller.getUserById);
router.post(
  "/",
  controller.createUserValidators,
  handleValidationErrors,
  controller.createUser,
);
router.put(
  "/:id",
  controller.updateUserValidators,
  handleValidationErrors,
  controller.updateUser,
);
router.delete(
  "/:id",
  controller.deleteUserValidators,
  handleValidationErrors,
  controller.deleteUser,
);

export default router;
