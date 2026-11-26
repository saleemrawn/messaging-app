import type { ParamsDictionary } from "express-serve-static-core";
import type { UserAccount } from "../../generated/prisma/client.ts";

interface UserAvatarReqParams extends ParamsDictionary {
  id: string;
}

interface UserAvatarValidatedReq {
  id: UserAccount["id"];
}

interface GetAvatarReqParams extends ParamsDictionary {
  fileName: string;
}

interface GetAvatarValidatedReq {
  fileName: string;
}

export type {
  UserAvatarReqParams,
  UserAvatarValidatedReq,
  GetAvatarReqParams,
  GetAvatarValidatedReq,
};
