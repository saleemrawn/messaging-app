import user from "../src/routes/user-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { errorHandler } from "../src/middleware/error-middleware.ts";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", user);
app.use(errorHandler);

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

describe("error middleware", () => {
  test("returns resource already exists error", async () => {
    const res = await request(app).post("/api/users").send({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@email.com",
      username: "johndoe01",
      password: "Monkey123!",
    });

    expect(res.status).toBe(409);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: false,
      code: "P2002",
      message: "Resource already exists",
    });
  });

  test("returns resource not found error", async () => {
    const res = await request(app).get("/api/users/999");

    expect(res.status).toBe(404);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: false,
      message: "User not found",
    });
  });
});
