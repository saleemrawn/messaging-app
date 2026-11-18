import "dotenv/config";
import { app } from "./app.ts";

app.listen(process.env.PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`App listening on port ${process.env.PORT ?? "unknown"}...`);
});
