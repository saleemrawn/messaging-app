import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./user-controllers.ts";
import {
  createUserValidators,
  updateUserValidators,
  deleteUserValidators,
} from "./user-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUserValidators, handleValidationErrors, createUser);
router.put("/:id", updateUserValidators, handleValidationErrors, updateUser);
router.delete("/:id", deleteUserValidators, handleValidationErrors, deleteUser);

export default router;
