import user from "../src/user/user-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
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
      userAccount: {
        id: 1,
        username: "johndoe01",
      },
    },
    {
      id: 2,
      firstName: "Aisha",
      lastName: "Doe",
      email: "aisha.doe01@email.com",
      userAccount: {
        id: 2,
        username: "aishadoe01",
      },
    },
    {
      id: 3,
      firstName: "Phillipe",
      lastName: "Doe",
      email: "phillipe.doe01@email.com",
      userAccount: {
        id: 3,
        username: "phillipedoe01",
      },
    },
    {
      id: 4,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe01@email.com",
      userAccount: {
        id: 4,
        username: "janedoe01",
      },
    },
  ],
  success: true,
};

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

describe("user route", () => {
  test("returns all users", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual(users);
  });

  describe("get user endpoint", () => {
    test("returns a user", async () => {
      const res = await request(app).get("/api/users/4");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe01@email.com",
          userAccount: {
            id: 4,
            username: "janedoe01",
          },
        },
      });
    });

    test("returns user not found", async () => {
      const res = await request(app).get("/api/users/9999");

      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });
  });

  describe("create user endpoint", () => {
    test("create a user", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "Money0987!",
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
          userAccount: {
            id: 5,
            username: "antoinedoe01",
          },
        },
      });
    });

    test("returns missing first name errors", async () => {
      const user = {
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "Money0987!",
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
        username: "antoinedoe01",
        password: "Money0987!",
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
        username: "antoinedoe01",
        password: "Money0987!",
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
        username: "antoinedoe01",
        password: "Money0987!",
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

    test("returns missing email errors", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        username: "antoinedoe01",
        password: "Money0987!",
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
            msg: "Email is required",
            path: "email",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Email must be a valid format",
            path: "email",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid email format error", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01email.com",
        username: "antoinedoe01",
        password: "Money0987!",
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
            value: "antoine.doe01email.com",
            msg: "Email must be a valid format",
            path: "email",
            location: "body",
          },
        ],
      });
    });

    test("returns missing username error", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "",
        password: "Money0987!",
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
            msg: "Username is required",
            path: "username",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Username must be between 3 and 30 characters long",
            path: "username",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Username must contain only letters, numbers, hyphen (-), underscore (_) or period (.)",
            path: "username",
            location: "body",
          },
        ],
      });
    });

    test("returns username format error", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01@!",
        password: "Money0987!",
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
            value: "antoinedoe01@!",
            msg: "Username must contain only letters, numbers, hyphen (-), underscore (_) or period (.)",
            path: "username",
            location: "body",
          },
        ],
      });
    });

    test("returns missing password error", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "",
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
            msg: "Password is required",
            path: "password",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Passwords must at least 8 characters long and contain an uppercase letter, number and symbol",
            path: "password",
            location: "body",
          },
        ],
      });
    });

    test("returns password format error", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "money",
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
            value: "money",
            msg: "Passwords must at least 8 characters long and contain an uppercase letter, number and symbol",
            path: "password",
            location: "body",
          },
        ],
      });
    });
  });

  describe("update user endpoint", () => {
    test("update user first name", async () => {
      const user = {
        firstName: "Janet",
        lastName: "Doe",
        email: "jane.doe01@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          firstName: "Janet",
          lastName: "Doe",
          email: "jane.doe01@email.com",
          userAccount: {
            id: 4,
            username: "janedoe01",
          },
        },
      });
    });

    test("update user last name", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doey",
        email: "jane.doe01@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          firstName: "Jane",
          lastName: "Doey",
          email: "jane.doe01@email.com",
          userAccount: {
            id: 4,
            username: "janedoe01",
          },
        },
      });
    });

    test("update user email", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doe",
        email: "janedoe@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          firstName: "Jane",
          lastName: "Doe",
          email: "janedoe@email.com",
          userAccount: {
            id: 4,
            username: "janedoe01",
          },
        },
      });
    });

    test("returns missing first name errors", async () => {
      const user = {
        lastName: "Doe",
        email: "janedoe@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
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
        firstName: "Jane123",
        lastName: "Doe",
        email: "janedoe@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "Jane123",
            msg: "First name should only contain letters",
            path: "firstName",
            location: "body",
          },
        ],
      });
    });

    test("returns missing last name errors", async () => {
      const user = {
        firstName: "Jane",
        email: "janedoe@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
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
        firstName: "Jane",
        lastName: "Doe123",
        email: "janedoe@email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
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

    test("returns missing email errors", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doe",
      };

      const res = await request(app)
        .put("/api/users/4")
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
            msg: "Email is required",
            path: "email",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Email must be a valid format",
            path: "email",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid email format error", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe01email.com",
      };

      const res = await request(app)
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "jane.doe01email.com",
            msg: "Email must be a valid format",
            path: "email",
            location: "body",
          },
        ],
      });
    });
  });

  describe("delete user endpoint", () => {
    test("soft delete user", async () => {
      const res = await request(app).delete("/api/users/4");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe01@email.com",
          userAccount: {
            id: 4,
            username: "janedoe01",
          },
        },
      });
    });

    test("returns 404 for a soft-deleted user", async () => {
      await request(app).delete("/api/users/4").expect(200);

      const res = await request(app).get("/api/users/4");
      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });
  });
});
