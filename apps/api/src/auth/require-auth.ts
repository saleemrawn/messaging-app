import passport from "passport";
import type { RequestHandler } from "express";

const requireAuth = passport.authenticate("jwt", {
  session: false,
}) as RequestHandler;

export { requireAuth };
