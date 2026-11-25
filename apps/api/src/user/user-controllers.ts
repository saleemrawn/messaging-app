import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  UserResBody,
  CreateUserReqBody,
  CreateUserValidatedData,
  GetUserByIdReqParams,
  GetUserByIdValidatedReq,
  LookupUserReqQuery,
  LookupUserValidatedReq,
  LookupUserResBody,
  UpdateUserReqParams,
  UpdateUserReqBody,
  UpdateUserValidatedReq,
  DeleteUserReqParams,
  DeleteUserValidatedReq,
} from "../types/user-types.ts";
import { getAuthenticatedUserAccountId } from "../auth/auth-helpers.ts";
import { matchedData, type ValidationError } from "express-validator";
import * as repository from "./user-repository.ts";
import bcrypt from "bcrypt";

const getUsers = async (
  _req: Request,
  res: Response<ApiResponse<UserResBody[]>>,
) => {
  const users = await repository.getUsers();
  res.status(200).json({ success: true, data: users });
};

const getUserById = async (
  req: Request<GetUserByIdReqParams>,
  res: Response<ApiResponse<UserResBody>>,
) => {
  const { id }: GetUserByIdValidatedReq = matchedData(req);
  const user = await repository.getUserByAccountId(id);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({ success: true, data: user });
};

// Finds a recipient by their full email address. The caller's own address is
// treated as not found.
const lookupUser = async (
  req: Request<object, object, object, LookupUserReqQuery>,
  res: Response<ApiResponse<LookupUserResBody, ValidationError[]>>,
) => {
  const { email }: LookupUserValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserAccountId(req);

  const user = await repository.findUserByEmail(email, userAccountId);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({ success: true, data: user });
};

// Public route: used by new users to sign up, so no authentication required
const createUser = async (
  req: Request<object, object, CreateUserReqBody, object>,
  res: Response<ApiResponse<UserResBody, ValidationError[]>>,
) => {
  const {
    firstName,
    lastName,
    email,
    username,
    password,
  }: CreateUserValidatedData = matchedData(req);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await repository.createUser({
    firstName,
    lastName,
    email,
    username,
    password: hashedPassword,
  });
  res.status(201).json({ success: true, data: user });
};

const INCORRECT_PASSWORD_ERROR: ValidationError = {
  type: "field",
  path: "currentPassword",
  location: "body",
  msg: "Current password is incorrect",
};

// Returns the hash to store for a password change, or null when the current
// password doesn't match. The validators guarantee both passwords are present.
const hashNewPassword = async (
  userAccountId: number,
  currentPassword: string,
  newPassword: string,
): Promise<string | null> => {
  const account = await repository.getPasswordHashByAccountId(userAccountId);
  if (!account) return null;

  const isMatch = await bcrypt.compare(currentPassword, account.password);
  return isMatch ? bcrypt.hash(newPassword, 10) : null;
};

const updateUser = async (
  req: Request<UpdateUserReqParams, object, UpdateUserReqBody, object>,
  res: Response<ApiResponse<UserResBody, ValidationError[]>>,
) => {
  const {
    id,
    firstName,
    lastName,
    email,
    currentPassword,
    newPassword,
  }: UpdateUserValidatedReq = matchedData(req);

  const userAccountId = getAuthenticatedUserAccountId(req);

  if (id !== userAccountId) {
    res.status(403).json({
      success: false,
      message: "You can only update your own account",
    });
    return;
  }

  // undefined: no password change requested; null: current password is wrong.
  const password = newPassword
    ? await hashNewPassword(userAccountId, currentPassword ?? "", newPassword)
    : undefined;

  if (password === null) {
    res
      .status(400)
      .json({ success: false, errors: [INCORRECT_PASSWORD_ERROR] });
    return;
  }

  const user = await repository.updateUser({
    userAccountId,
    firstName,
    lastName,
    email,
    password,
  });
  res.status(200).json({ success: true, data: user });
};

const deleteUser = async (
  req: Request<DeleteUserReqParams, object, object, object>,
  res: Response<ApiResponse<UserResBody>>,
) => {
  const { id }: DeleteUserValidatedReq = matchedData(req);
  const authenticatedUserId = getAuthenticatedUserAccountId(req);

  if (id !== authenticatedUserId) {
    res.status(403).json({
      success: false,
      message: "You can only delete your own account",
    });
    return;
  }

  const user = await repository.deleteUser(authenticatedUserId);
  res.status(200).json({ success: true, data: user });
};

export {
  getUsers,
  getUserById,
  lookupUser,
  createUser,
  updateUser,
  deleteUser,
};
