import type { NextFunction, Request, Response } from "express";
import type { ApiResponse } from "../../types/api-types.ts";
import {
  body,
  validationResult,
  matchedData,
  param,
  type ValidationError,
} from "express-validator";
import * as repository from "../repositories/user-repository.ts";

const userIdValidator = [
  param("id")
    .trim()
    .optional()
    .isInt()
    .withMessage("Invalid user ID, expected number")
    .toInt(),
];

const userValidators = [
  param("id").trim().optional().isInt().withMessage("Invalid user ID").toInt(),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name required")
    .isAlpha()
    .withMessage("First name should only contain letters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name required")
    .isAlpha()
    .withMessage("Last name should only contain letters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid format"),
];

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const getUsers = async (
  req: Request,
  res: Response<ApiResponse<User[]>>,
  next: NextFunction,
) => {
  try {
    const users = await repository.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const getUser = async (
  req: Request,
  res: Response<ApiResponse<User>>,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const user = await repository.getUser(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const createUser = async (
  req: Request<
    object,
    object,
    Pick<User, "firstName" | "lastName" | "email">,
    object
  >,
  res: Response<ApiResponse<User, ValidationError[]>>,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      firstName,
      lastName,
      email,
    }: Pick<User, "firstName" | "lastName" | "email"> = matchedData(req);

    const user = await repository.createUser({ firstName, lastName, email });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (
  req: Request<
    Pick<User, "id">,
    object,
    Pick<User, "firstName" | "lastName" | "email">,
    object
  >,
  res: Response<ApiResponse<User, ValidationError[]>>,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

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
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (
  req: Request<Pick<User, "id">, object, object, object>,
  res: Response<ApiResponse<User>>,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const user = await repository.deleteUser(id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  userValidators,
  userIdValidator,
};
