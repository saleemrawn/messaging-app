import type { Request, Response } from "express";
import { matchedData, type ValidationError } from "express-validator";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  AddContactReqBody,
  AddContactResBody,
  AddContactValidatedReq,
  GetContactsResBody,
  RemoveContactReqParams,
  RemoveContactResBody,
  RemoveContactValidatedReq,
} from "../types/contact-types.ts";
import { getAuthenticatedUserAccountId } from "../auth/auth-helpers.ts";
import * as repository from "./contact-repository.ts";
import * as userRepository from "../user/user-repository.ts";

const getContacts = async (
  req: Request,
  res: Response<ApiResponse<GetContactsResBody, ValidationError[]>>,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  const contacts = await repository.getContacts(userAccountId);

  res.status(200).json({ success: true, data: contacts });
};

// Answers 201 for a new (or restored) contact and 200 when they were already
// in the caller's list.
const addContact = async (
  req: Request<object, object, AddContactReqBody, object>,
  res: Response<ApiResponse<AddContactResBody, ValidationError[]>>,
) => {
  const { contactId }: AddContactValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserAccountId(req);

  if (contactId === userAccountId) {
    res.status(400).json({
      success: false,
      message: "You can't add yourself as a contact",
    });
    return;
  }

  if (!(await userRepository.getUserByAccountId(contactId))) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  const { contact, isCreated } = await repository.addContact(
    userAccountId,
    contactId,
  );

  res.status(isCreated ? 201 : 200).json({ success: true, data: contact });
};

const removeContact = async (
  req: Request<RemoveContactReqParams, object, object, object>,
  res: Response<ApiResponse<RemoveContactResBody, ValidationError[]>>,
) => {
  const { contactId }: RemoveContactValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserAccountId(req);

  if (!(await repository.removeContact(userAccountId, contactId))) {
    res.status(404).json({ success: false, message: "Contact not found" });
    return;
  }

  res.status(200).json({ success: true, data: { id: contactId } });
};

export { getContacts, addContact, removeContact };
