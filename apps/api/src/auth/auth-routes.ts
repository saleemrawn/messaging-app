import { Router } from "express";
import { login, logout, getCurrentUser } from "./auth-controller.ts";
import { requireAuth } from "./require-auth.ts";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);

export default router;
