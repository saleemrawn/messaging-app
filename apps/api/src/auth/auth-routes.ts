import { Router } from "express";
import { login, logout, getCurrentUser } from "./auth-controller.ts";
import { requireAuth } from "./require-auth.ts";
import { accountRateLimit } from "../rate-limit/rate-limit-middleware.ts";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, accountRateLimit, getCurrentUser);

export default router;
