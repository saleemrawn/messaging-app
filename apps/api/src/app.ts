import "dotenv/config";
import express, { type Express } from "express";

const app: Express = express();

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`App listening on port ${process.env.PORT ?? "unknown"}...`);
});
