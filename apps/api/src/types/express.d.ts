import type { UserAccount } from "../../generated/prisma/client.ts";

declare global {
  namespace Express {
    interface User {
      id: UserAccount["id"];
    }
  }
}
