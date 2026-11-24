import { isAxiosError } from "axios";
import type { ErrorResponse } from "./types.ts";

const GENERIC_ERROR_MESSAGE = "Something went wrong, please try again";
const CONFLICT_MESSAGE = "That username or email is already taken";
const HTTP_CONFLICT = 409;
const HTTP_UNAUTHORIZED = 401;

type FieldErrors = Partial<Record<string, string>>;

interface ParsedApiError {
  message?: string;
  fieldErrors: FieldErrors;
}

function toFieldErrors(body: ErrorResponse | undefined): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const { path, msg } of body?.errors ?? []) {
    fieldErrors[path] ??= msg;
  }
  return fieldErrors;
}

function isUnauthorizedError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === HTTP_UNAUTHORIZED;
}

function parseApiError(error: unknown): ParsedApiError {
  if (!isAxiosError<ErrorResponse>(error) || !error.response) {
    return { message: GENERIC_ERROR_MESSAGE, fieldErrors: {} };
  }

  const { status, data } = error.response;
  const fieldErrors = toFieldErrors(data);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const message =
    status === HTTP_CONFLICT
      ? CONFLICT_MESSAGE
      : (data.message ?? GENERIC_ERROR_MESSAGE);

  return { message, fieldErrors };
}

export { isUnauthorizedError, parseApiError };
export type { FieldErrors, ParsedApiError };
