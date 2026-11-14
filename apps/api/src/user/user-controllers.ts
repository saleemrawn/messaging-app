import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type { User, UserAccount } from "../types/user-types.ts";
import {
  body,
  matchedData,
  param,
  type ValidationError,
} from "express-validator";
import * as repository from "./user-repository.ts";
import bcrypt from "bcrypt";

const idValidator = param("id")
  .trim()
  .optional()
  .isInt()
  .withMessage("Invalid user ID, expected number")
  .toInt();

const firstNameValidator = body("firstName")
  .trim()
  .notEmpty()
  .withMessage("First name required")
  .isAlpha()
  .withMessage("First name should only contain letters");

const lastNameValidator = body("lastName")
  .trim()
  .notEmpty()
  .withMessage("Last name required")
  .isAlpha()
  .withMessage("Last name should only contain letters");

const emailValidator = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Email must be a valid format");

const usernameValidator = body("username")
  .trim()
  .notEmpty()
  .withMessage("Username is required")
  .isLength({ min: 3, max: 30 })
  .withMessage("Username must be between 3 and 30 characters long")
  .isAlphanumeric(undefined, { ignore: "_-." })
  .withMessage(
    "Username must contain only letters, numbers, hyphen (-), underscore (_) or period (.)",
  );

const passwordValidator = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isStrongPassword()
  .withMessage(
    "Passwords must at least 8 characters long and contain an uppercase letter, number and symbol",
  );

const createUserValidators = [
  firstNameValidator,
  lastNameValidator,
  emailValidator,
  usernameValidator,
  passwordValidator,
];

const updateUserValidators = [
  idValidator,
  firstNameValidator,
  lastNameValidator,
  emailValidator,
];

const deleteUserValidators = [idValidator];

const getUsers = async (_req: Request, res: Response<ApiResponse<User[]>>) => {
  const users = await repository.getUsers();
  res.status(200).json({ success: true, data: users });
};

const getUserById = async (req: Request, res: Response<ApiResponse<User>>) => {
  const id = Number(req.params.id);
  const user = await repository.getUser(id);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({ success: true, data: user });
};

const createUser = async (
  req: Request<
    object,
    object,
    Pick<
      UserAccount,
      "firstName" | "lastName" | "email" | "username" | "password"
    >,
    object
  >,
  res: Response<ApiResponse<User, ValidationError[]>>,
) => {
  const {
    firstName,
    lastName,
    email,
    username,
    password,
  }: Pick<
    UserAccount,
    "firstName" | "lastName" | "email" | "username" | "password"
  > = matchedData(req);

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
  req: Request<
    Pick<User, "id">,
    object,
    Pick<User, "firstName" | "lastName" | "email">,
    object
  >,
  res: Response<ApiResponse<User, ValidationError[]>>,
) => {
  const {
    id,
    firstName,
    lastName,
    email,
  }: Pick<User, "id" | "firstName" | "lastName" | "email"> = matchedData(req);

  const user = await repository.updateUser({
    id,
    firstName,
    lastName,
    email,
  });
  res.status(200).json({ success: true, data: user });
};

const deleteUser = async (
  req: Request<Pick<User, "id">, object, object, object>,
  res: Response<ApiResponse<User>>,
) => {
  const id = req.params.id;
  const user = await repository.deleteUser(id);
  res.status(200).json({ success: true, data: user });
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createUserValidators,
  updateUserValidators,
  deleteUserValidators,
};
