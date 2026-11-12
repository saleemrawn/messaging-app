import "dotenv/config";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/error-middleware.ts";
import * as routes from "./routes/routes.ts";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
