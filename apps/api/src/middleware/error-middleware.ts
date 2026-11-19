import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

const HANDLED_PRISMA_CODES = ["P2002", "P2025"];

const getHttpStatusCode = (err: unknown): number | undefined => {
  if (
    err instanceof Error &&
    "statusCode" in err &&
    typeof err.statusCode === "number" &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
  ) {
    return err.statusCode;
  }

  return undefined;
};

const getErrorStatusCode = (err: unknown) => {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") return 409;
    if (err.code === "P2025") return 404;
    return 400;
  }

  return getHttpStatusCode(err) ?? 500;
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") return "Resource already exists";
    if (err.code === "P2025") return "Resource not found";
    return "Database request failed";
  }

  const statusCode = getHttpStatusCode(err);
  if (err instanceof Error && statusCode !== undefined && statusCode < 500) {
    return err.message;
  }

  return "Internal Server Error";
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

  const isUnhandledPrismaError =
    err instanceof PrismaClientKnownRequestError &&
    !HANDLED_PRISMA_CODES.includes(err.code);

  if (statusCode >= 500 || isUnhandledPrismaError) {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, code, message });
};

export { errorHandler };
