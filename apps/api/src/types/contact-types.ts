import type { ParamsDictionary } from "express-serve-static-core";
import type { UserAccount } from "../../generated/prisma/client.ts";
import type { LookupUserResBody } from "./user-types.ts";

// A contact is shown the same way as a looked-up user: their account id plus
// name and email.
type ContactResBody = LookupUserResBody;

type GetContactsResBody = ContactResBody[];

interface AddContactReqBody {
  contactId: UserAccount["id"];
}

interface AddContactValidatedReq {
  contactId: UserAccount["id"];
}

type AddContactResBody = ContactResBody;

interface RemoveContactReqParams extends ParamsDictionary {
  contactId: string;
}

interface RemoveContactValidatedReq {
  contactId: UserAccount["id"];
}

type RemoveContactResBody = Pick<UserAccount, "id">;

export type {
  ContactResBody,
  GetContactsResBody,
  AddContactReqBody,
  AddContactValidatedReq,
  AddContactResBody,
  RemoveContactReqParams,
  RemoveContactValidatedReq,
  RemoveContactResBody,
};
