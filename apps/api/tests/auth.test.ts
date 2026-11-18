import { describe, test, expect, beforeAll } from "vitest";
import { createUser } from "../src/user/user-repository.ts";
import { resetDbTables } from "./helpers/database.ts";
import auth from "../src/auth/auth-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import bcrypt from "bcrypt";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", auth);

interface LoginResponse {
  token?: string;
}

describe("auth routes", () => {
  beforeAll(async () => {
    await resetDbTables();

    const hashedPassword = await bcrypt.hash("testpassword", 10);

    await createUser({
      firstName: "Paula",
      lastName: "Doe",
      email: "paula.doe@email.com",
      username: "pauladoe01",
      password: hashedPassword,
    });
  });

  test("should login a user and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "pauladoe01", password: "testpassword" });

    expect(res.statusCode).toBe(200);

    const resBody = res.body as LoginResponse;
    expect(resBody.token).toBeDefined();
  });

  test("should return 401 and no token when the password is wrong", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "pauladoe01", password: "wrongpassword" });

    expect(res.statusCode).toBe(401);

    const resBody = res.body as LoginResponse;
    expect(resBody.token).toBeUndefined();
  });

  test("should return 401 and no token when the user does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "nonexistentuser", password: "testpassword" });

    expect(res.statusCode).toBe(401);

    const resBody = res.body as LoginResponse;
    expect(resBody.token).toBeUndefined();
  });

  test("should return 400 and no token when the username is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "testpassword" });

    expect(res.statusCode).toBe(400);

    const resBody = res.body as LoginResponse;
    expect(resBody.token).toBeUndefined();
  });

  test("should return 400 and no token when the password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "pauladoe01" });

    expect(res.statusCode).toBe(400);

    const resBody = res.body as LoginResponse;
    expect(resBody.token).toBeUndefined();
  });

  test("should return 400 and no token when both fields are missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.statusCode).toBe(400);

    const resBody = res.body as LoginResponse;
    expect(resBody.token).toBeUndefined();
  });
});
