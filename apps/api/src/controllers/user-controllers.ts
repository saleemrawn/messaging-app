import type { NextFunction, Request, Response } from "express";
import * as repository from "../repositories/user-repository.ts";
import type { ApiResponse } from "../../types/api-types.ts";

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

export { getUsers, getUser };
