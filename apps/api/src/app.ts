import express, { type Express } from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/error-middleware.ts";
import { jwtStrategy } from "./auth/passport/jwt-strategy.ts";
import { localStrategy } from "./auth/passport/local-strategy.ts";
import { globalIpRateLimit } from "./rate-limit/rate-limit-middleware.ts";
import * as routes from "./routes.ts";

// Hops of reverse proxy in front of the API, or false when clients connect
// directly. It decides where req.ip (and so every per-IP rate limit) comes
// from. `true` (trust every hop) is never allowed: clients could then pick
// their own IP with X-Forwarded-For.
type TrustProxy = number | false;

interface AppOptions {
  trustProxy?: TrustProxy;
}

function parseTrustProxy(value: string | undefined): TrustProxy {
  if (value === undefined || value === "" || value === "false") {
    return false;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  throw new Error(
    `TRUST_PROXY must be "false" or a number of proxy hops, got "${value}"`,
  );
}

export function createApp({
  trustProxy = parseTrustProxy(process.env.TRUST_PROXY),
}: AppOptions = {}): Express {
  const app: Express = express();

  app.set("trust proxy", trustProxy);

  passport.use("jwt", jwtStrategy);
  passport.use("local", localStrategy);

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  // After cors, so a 429 carries CORS headers the browser can read, and
  // before body parsing, so a flood is turned away cheaply.
  app.use(globalIpRateLimit);
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
