import "dotenv/config";
import express, { type Express } from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error-middleware.ts";
import { jwtStrategy } from "./auth/passport/jwt-strategy.ts";
import { localStrategy } from "./auth/passport/local-strategy.ts";
import * as routes from "./routes.ts";

const app: Express = express();

passport.use("jwt", jwtStrategy);
passport.use("local", localStrategy);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/users", routes.user);
app.use("/api/conversations", routes.conversation);
app.use("/api/messages", routes.message);
app.use(errorHandler);

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`App listening on port ${process.env.PORT ?? "unknown"}...`);
});
