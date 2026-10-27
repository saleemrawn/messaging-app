import user from "../src/routes/user-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import { populateDb, resetDbTables } from "./helpers/database.ts";
import { anyString } from "./helpers/types.ts";
import { beforeEach, describe, expect, test } from "vitest";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", user);

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

const userJane = {
  success: true,
  data: {
    id: 4,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe01@email.com",
    createdAt: "2026-01-01T20:00:00.000Z",
    updatedAt: "2026-01-01T20:00:00.000Z",
    deletedAt: null,
  },
};

beforeEach(async () => {
  await resetDbTables();
  await populateDb();
});

describe("user route", () => {
  test("returns all users", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual(users);
  });

  test("returns a user", async () => {
    const res = await request(app).get("/api/users/4");

    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual(userJane);
  });

  test("returns user not found", async () => {
    const res = await request(app).get("/api/users/9999");

    expect(res.status).toBe(404);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({ success: false, message: "User not found" });
  });

  test("create a user", async () => {
    const user = {
      firstName: "Antoine",
      lastName: "Doe",
      email: "antoine.doe01@email.com",
    };

    const res = await request(app)
      .post("/api/users")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(201);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: true,
      data: {
        id: 5,
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        createdAt: anyString(),
        updatedAt: anyString(),
        deletedAt: null,
      },
    });
  });

  test("returns missing first name errors", async () => {
    const user = {
      lastName: "Doe",
      email: "antoine.doe01@email.com",
    };

    const res = await request(app)
      .post("/api/users")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: false,
      errors: [
        {
          type: "field",
          value: "",
          msg: "First name required",
          path: "firstName",
          location: "body",
        },
        {
          type: "field",
          value: "",
          msg: "First name should only contain letters",
          path: "firstName",
          location: "body",
        },
      ],
    });
  });

  test("returns letters only in first name error", async () => {
    const user = {
      firstName: "Antoine123",
      lastName: "Doe",
      email: "antoine.doe01@email.com",
    };

    const res = await request(app)
      .post("/api/users")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: false,
      errors: [
        {
          type: "field",
          value: "Antoine123",
          msg: "First name should only contain letters",
          path: "firstName",
          location: "body",
        },
      ],
    });
  });

  test("returns missing last name errors", async () => {
    const user = {
      firstName: "Antoine",
      email: "antoine.doe01@email.com",
    };

    const res = await request(app)
      .post("/api/users")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: false,
      errors: [
        {
          type: "field",
          value: "",
          msg: "Last name required",
          path: "lastName",
          location: "body",
        },
        {
          type: "field",
          value: "",
          msg: "Last name should only contain letters",
          path: "lastName",
          location: "body",
        },
      ],
    });
  });

  test("returns letters only in last name error", async () => {
    const user = {
      firstName: "Antoine",
      lastName: "Doe123",
      email: "antoine.doe01@email.com",
    };

    const res = await request(app)
      .post("/api/users")
      .send(user)
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual({
      success: false,
      errors: [
        {
          type: "field",
          value: "Doe123",
          msg: "Last name should only contain letters",
          path: "lastName",
          location: "body",
        },
      ],
    });
  });
});
