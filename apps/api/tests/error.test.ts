import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import * as userRepository from "../src/user/user-repository.ts";

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("error middleware", () => {
  describe("unique constraint errors (P2002)", () => {
    test("returns resource already exists error for a duplicate username", async () => {
      const user = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@email.com",
        username: "johndoe01",
        password: "Monkey123!",
      };

      const agent = createUnauthenticatedAgent();
      const res = await agent.post("/api/users").send(user);

      expect(res.status).toBe(409);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        code: "P2002",
        message: "Resource already exists",
      });
    });

    test("returns resource already exists error for a duplicate email", async () => {
      const user = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe01@email.com",
        username: "johndoe02",
        password: "Monkey123!",
      };

      const agent = createUnauthenticatedAgent();
      const res = await agent.post("/api/users").send(user);

      expect(res.status).toBe(409);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        code: "P2002",
        message: "Resource already exists",
      });
    });
  });

  describe("record not found errors (P2025)", () => {
    test("returns resource not found error when Prisma cannot find the record", async () => {
      vi.spyOn(userRepository, "getUsers").mockRejectedValueOnce(
        new PrismaClientKnownRequestError("Record not found", {
          code: "P2025",
          clientVersion: "test",
        }),
      );

      const agent = createAuthenticatedAgentAs(1);
      const res = await agent.get("/api/users");

      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        code: "P2025",
        message: "Resource not found",
      });
    });
  });

  describe("unexpected errors", () => {
    test("returns a generic 500 error and does not leak error details", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.spyOn(userRepository, "getUsers").mockRejectedValueOnce(
        new Error("database exploded"),
      );

      const agent = createAuthenticatedAgentAs(1);
      const res = await agent.get("/api/users");

      expect(res.status).toBe(500);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        message: "Internal Server Error",
      });
      expect(JSON.stringify(res.body)).not.toContain("database exploded");
    });
  });

  describe("unmapped Prisma errors", () => {
    test("returns a generic database error and does not leak error details", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.spyOn(userRepository, "getUsers").mockRejectedValueOnce(
        new PrismaClientKnownRequestError(
          "Foreign key constraint failed on table user_account",
          { code: "P2003", clientVersion: "test" },
        ),
      );

      const agent = createAuthenticatedAgentAs(1);
      const res = await agent.get("/api/users");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        code: "P2003",
        message: "Database request failed",
      });
      expect(JSON.stringify(res.body)).not.toContain("user_account");
    });
  });

  describe("malformed requests", () => {
    // body-parser attaches statusCode 400 to its parse errors
    test("returns a 400 JSON error for a malformed JSON body", async () => {
      const agent = createUnauthenticatedAgent();
      const res = await agent
        .post("/api/users")
        .set("Content-Type", "application/json")
        .send('{"firstName": "John",');

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toMatchObject({ success: false });
    });
  });
});
