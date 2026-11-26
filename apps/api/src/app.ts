import express, { type Express } from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/error-middleware.ts";
import { jwtStrategy } from "./auth/passport/jwt-strategy.ts";
import { localStrategy } from "./auth/passport/local-strategy.ts";
import * as routes from "./routes.ts";

export function createApp(): Express {
  const app: Express = express();

  passport.use("jwt", jwtStrategy);
  passport.use("local", localStrategy);

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use("/api/auth", routes.auth);
  app.use("/api/users", routes.user);
  app.use("/api/conversations", routes.conversation);
  app.use("/api/messages", routes.message);
  app.use("/api/contacts", routes.contact);
  app.use("/api/avatars", routes.avatar);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
