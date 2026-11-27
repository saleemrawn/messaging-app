import type { CookieOptions, Request, Response } from "express";
import type { LoginInfo } from "../types/auth-types.ts";
import type { ApiResponse } from "../types/api-types.ts";
import type { UserResBody } from "../types/user-types.ts";
import {
  getUserByAccountId,
  getUserCredentialsByUsername,
} from "../user/user-repository.ts";
import { getAuthenticatedUserAccountId } from "./auth-helpers.ts";
import {
  assertLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from "../rate-limit/login-rate-limit.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_MS = 60 * 60 * 1000;

// Shared by login and logout: browsers only drop a cookie when it is cleared
// with the same attributes it was set with.
const TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const login = async (
  req: Request<object, object, LoginInfo, object>,
  res: Response,
) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  const { username, password } = req.body;

  // The body is untrusted, so check the types as well as presence.
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  // Outside the try below, whose catch would turn the 429 into a 500.
  await assertLoginAllowed(res, username, req.ip);

  try {
    const user = await getUserCredentialsByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await recordLoginFailure(username, req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid username or password, please try again!",
      });
    }

    await recordLoginSuccess(username, req.ip);

    const token = jwt.sign({ userAccountId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .cookie(TOKEN_COOKIE_NAME, token, {
        ...TOKEN_COOKIE_OPTIONS,
        maxAge: TOKEN_MAX_AGE_MS,
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

// Public and idempotent so a client with an expired token can still log out.
const logout = (_req: Request, res: Response<ApiResponse<never>>) => {
  res
    .clearCookie(TOKEN_COOKIE_NAME, TOKEN_COOKIE_OPTIONS)
    .status(200)
    .json({ success: true, message: "Logged out" });
};

export { login, logout, getCurrentUser };
