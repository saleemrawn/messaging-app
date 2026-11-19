import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  User,
  CreateUserReqBody,
  CreateUserValidatedData,
  GetUserByIdReqParams,
  GetUserByIdValidatedReq,
  UpdateUserReqParams,
  UpdateUserReqBody,
  UpdateUserValidatedReq,
  DeleteUserReqParams,
  DeleteUserValidatedReq,
} from "../types/user-types.ts";
import { getAuthenticatedUserId } from "../auth/auth-helpers.ts";
import { matchedData, type ValidationError } from "express-validator";
import * as repository from "./user-repository.ts";
import bcrypt from "bcrypt";

const getUsers = async (_req: Request, res: Response<ApiResponse<User[]>>) => {
  const users = await repository.getUsers();
  res.status(200).json({ success: true, data: users });
};

const getUserById = async (
  req: Request<GetUserByIdReqParams>,
  res: Response<ApiResponse<User>>,
) => {
  const { id }: GetUserByIdValidatedReq = matchedData(req);
  const user = await repository.getUserById(id);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({ success: true, data: user });
};

// Public route: used by new users to sign up, so no authentication required
const createUser = async (
  req: Request<object, object, CreateUserReqBody, object>,
  res: Response<ApiResponse<User, ValidationError[]>>,
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

const updateUser = async (
  req: Request<UpdateUserReqParams, object, UpdateUserReqBody, object>,
  res: Response<ApiResponse<User, ValidationError[]>>,
) => {
  const { id, firstName, lastName, email }: UpdateUserValidatedReq =
    matchedData(req);

  const authenticatedUserId = getAuthenticatedUserId(req);
  if (id !== authenticatedUserId) {
    res.status(403).json({
      success: false,
      message: "You can only update your own account",
    });
    return;
  }

  const user = await repository.updateUser({
    id: authenticatedUserId,
    firstName,
    lastName,
    email,
  });
  res.status(200).json({ success: true, data: user });
};

const deleteUser = async (
  req: Request<DeleteUserReqParams, object, object, object>,
  res: Response<ApiResponse<User>>,
) => {
  const { id }: DeleteUserValidatedReq = matchedData(req);
  const authenticatedUserId = getAuthenticatedUserId(req);

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

export { getUsers, getUserById, createUser, updateUser, deleteUser };
