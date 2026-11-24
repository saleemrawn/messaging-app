import type { Request, Response } from "express";
import type { LoginInfo } from "../types/auth-types.ts";
import type { ApiResponse } from "../types/api-types.ts";
import type { UserResBody } from "../types/user-types.ts";
import {
  getUserByAccountId,
  getUserCredentialsByUsername,
} from "../user/user-repository.ts";
import { getAuthenticatedUserAccountId } from "./auth-helpers.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (
  req: Request<object, object, LoginInfo, object>,
  res: Response,
) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    const user = await getUserCredentialsByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password, please try again!",
      });
    }

    const token = jwt.sign({ userAccountId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      })
      .status(200)
      .json({ success: true, message: "Authentication Successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCurrentUser = async (
  req: Request,
  res: Response<ApiResponse<UserResBody>>,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  const user = await getUserByAccountId(userAccountId);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({ success: true, data: user });
};

export { login, getCurrentUser };
