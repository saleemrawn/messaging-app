import { Router } from "express";
import { login, getCurrentUser } from "./auth-controller.ts";
import { requireAuth } from "./require-auth.ts";

const router = Router();

router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);

export default router;
