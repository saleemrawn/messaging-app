import { describe, expect, test } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { parseApiError } from "./api-errors.ts";

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("parseApiError", () => {
  test("maps express-validator errors to field messages", () => {
    const error = axiosErrorWith(400, {
      success: false,
      errors: [
        { type: "field", path: "email", msg: "Email is required" },
        { type: "field", path: "email", msg: "Email must be a valid format" },
        { type: "field", path: "username", msg: "Username is required" },
      ],
    });

    expect(parseApiError(error)).toEqual({
      fieldErrors: {
        email: "Email is required",
        username: "Username is required",
      },
    });
  });

  test("uses the response message when there are no field errors", () => {
    const error = axiosErrorWith(401, {
      success: false,
      message: "Invalid username or password, please try again!",
    });

    expect(parseApiError(error)).toEqual({
      message: "Invalid username or password, please try again!",
      fieldErrors: {},
    });
  });

  test("explains a 409 conflict as a taken username or email", () => {
    const error = axiosErrorWith(409, {
      success: false,
      message: "Resource already exists",
    });

    expect(parseApiError(error).message).toBe(
      "That username or email is already taken",
    );
  });

  test("falls back to a generic message for unknown errors", () => {
    expect(parseApiError(new Error("boom"))).toEqual({
      message: "Something went wrong, please try again",
      fieldErrors: {},
    });
  });
});
