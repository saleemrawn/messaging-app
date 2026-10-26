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

export { getUsers };
