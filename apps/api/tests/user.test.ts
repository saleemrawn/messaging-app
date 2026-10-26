import user from "../src/routes/user-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import { populateDb, resetDbTables } from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";

const app: Express = express();

app.use(express.urlencoded({ extended: false }));
app.use("/", user);

const users = {
  data: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe01@email.com",
      createdAt: "2026-01-01T20:00:00.000Z",
      updatedAt: "2026-01-01T20:00:00.000Z",
      deletedAt: null,
    },
    {
      id: 2,
      firstName: "Aisha",
      lastName: "Doe",
      email: "aisha.doe01@email.com",
      createdAt: "2026-01-01T20:00:00.000Z",
      updatedAt: "2026-01-01T20:00:00.000Z",
      deletedAt: null,
    },
    {
      id: 3,
      firstName: "Phillipe",
      lastName: "Doe",
      email: "phillipe.doe01@email.com",
      createdAt: "2026-01-01T20:00:00.000Z",
      updatedAt: "2026-01-01T20:00:00.000Z",
      deletedAt: null,
    },
    {
      id: 4,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe01@email.com",
      createdAt: "2026-01-01T20:00:00.000Z",
      updatedAt: "2026-01-01T20:00:00.000Z",
      deletedAt: null,
    },
  ],
  success: true,
};

beforeEach(async () => {
  await resetDbTables();
  await populateDb();
});

describe("user route", () => {
  test("returns all users", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual(users);
  });
});
