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
  getUserByIdValidators,
} from "./user-validators.ts";
import { handleValidationErrors } from "../middleware/validation-error-middleware.ts";
import { requireAuth } from "../auth/require-auth.ts";

const router = Router();

// Public: new users sign up before they have a token
router.post("/", createUserValidators, handleValidationErrors, createUser);

router.use(requireAuth);
router.get("/", getUsers);
router.get("/:id", getUserByIdValidators, handleValidationErrors, getUserById);
router.put("/:id", updateUserValidators, handleValidationErrors, updateUser);
router.delete("/:id", deleteUserValidators, handleValidationErrors, deleteUser);

export default router;
