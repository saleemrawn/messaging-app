import type { UserAccount } from "../../generated/prisma/client.ts";

interface LoginInfo {
  username: UserAccount["username"];
  password: UserAccount["password"];
}

export type { LoginInfo };
