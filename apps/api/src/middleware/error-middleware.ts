import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

const getErrorStatusCode = (err: unknown) => {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") return 409;
    if (err.code === "P2025") return 404;
    if (err.message === "Unauthorized") return 401;
    return 400;
  }

  if (
    err instanceof Error &&
    "statusCode" in err &&
    typeof err.statusCode === "number"
  ) {
    return err.statusCode;
  }

  return 500;
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") return "Resource already exists";
    if (err.code === "P2025") return "Resource not found";
    return "Database request failed";
  }

  if (err instanceof Error) return err.message;
  return "Internal server error";
};

const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = getErrorStatusCode(err);
  const message = getErrorMessage(err);
  const code =
    err instanceof PrismaClientKnownRequestError ? err.code : undefined;

  res.status(statusCode).json({ success: false, code, message });
};

export { errorHandler };
