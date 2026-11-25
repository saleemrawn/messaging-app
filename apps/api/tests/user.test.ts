import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createAuthenticatedAgent,
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";

/* const users = {
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
}; */

const users = {
  data: [
    {
      id: 1,
      username: "johndoe01",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe01@email.com",
    },
    {
      id: 2,
      username: "aishadoe01",
      firstName: "Aisha",
      lastName: "Doe",
      email: "aisha.doe01@email.com",
    },
    {
      id: 3,
      username: "phillipedoe01",
      firstName: "Phillipe",
      lastName: "Doe",
      email: "phillipe.doe01@email.com",
    },
    {
      id: 4,
      username: "janedoe01",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe01@email.com",
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
  describe("authentication", () => {
    const routes: ["get" | "put" | "delete", string][] = [
      ["get", "/api/users"],
      ["get", "/api/users/lookup?email=jane.doe01@email.com"],
      ["get", "/api/users/4"],
      ["put", "/api/users/4"],
      ["delete", "/api/users/4"],
    ];

    test.each(routes)(
      "%s %s returns 401 without a token",
      async (method, path) => {
        const agent = createUnauthenticatedAgent();
        const res = await agent[method](path);

        expect(res.status).toBe(401);
      },
    );
  });

  test("returns all users", async () => {
    const agent = await createAuthenticatedAgent();
    const res = await agent.get("/api/users");

    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(res.body).toEqual(users);
  });

  describe("get user endpoint", () => {
    test("returns a user", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/users/4");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          username: "janedoe01",
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe01@email.com",
        },
      });
    });

    test("returns user not found", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/users/9999");

      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });

    test("returns validation error for user ID type", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/users/abc");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid user ID, expected number",
            path: "id",
            location: "params",
          },
        ],
      });
    });
  });

  describe("lookup user by email endpoint", () => {
    const jane = {
      id: 4,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe01@email.com",
    };

    const lookup = async (email: string) => {
      const agent = await createAuthenticatedAgent();
      return agent.get("/api/users/lookup").query({ email });
    };

    test("returns the user's public profile", async () => {
      const res = await lookup("jane.doe01@email.com");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: true, data: jane });
    });

    test("matches case-insensitively and ignores surrounding spaces", async () => {
      const res = await lookup("  Jane.Doe01@Email.com ");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: jane });
    });

    test("returns not found for an unknown email", async () => {
      const res = await lookup("nobody@email.com");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });

    test("only matches the full email address", async () => {
      const res = await lookup("jane.doe01@email.co");

      expect(res.status).toBe(404);
    });

    test("returns not found for the caller's own email", async () => {
      const res = await lookup("john.doe01@email.com");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });

    test("returns not found for a soft-deleted user", async () => {
      await createAuthenticatedAgentAs(4).delete("/api/users/4").expect(200);

      const res = await lookup("jane.doe01@email.com");

      expect(res.status).toBe(404);
    });

    test("returns validation errors for a missing email", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/users/lookup");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Email is required",
            path: "email",
            location: "query",
          },
          {
            type: "field",
            value: "",
            msg: "Email must be a valid format",
            path: "email",
            location: "query",
          },
        ],
      });
    });

    test("returns a validation error for a malformed email", async () => {
      const res = await lookup("jane.doe01");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "jane.doe01",
            msg: "Email must be a valid format",
            path: "email",
            location: "query",
          },
        ],
      });
    });
  });

  describe("create user endpoint", () => {
    // Sign-up is public, so none of these requests carry a token
    const agent = createUnauthenticatedAgent();

    test("create a user", async () => {
      const user = {
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "Money0987!",
      };

      const res = await agent
        .post("/api/users")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 5,
          username: "antoinedoe01",
          firstName: "Antoine",
          lastName: "Doe",
          email: "antoine.doe01@email.com",
        },
      });
    });

    test("created user can log in", async () => {
      await agent
        .post("/api/users")
        .send({
          firstName: "Antoine",
          lastName: "Doe",
          email: "antoine.doe01@email.com",
          username: "antoinedoe01",
          password: "Money0987!",
        })
        .expect(201);

      await agent
        .post("/api/auth/login")
        .send({ username: "antoinedoe01", password: "Money0987!" })
        .expect(200);
    });

    test("returns missing first name errors", async () => {
      const user = {
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "Money0987!",
      };

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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

      const res = await agent
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
    // Jane is user 4, so these requests update her own account
    const jane = createAuthenticatedAgentAs(4);

    test("update user first name", async () => {
      const user = {
        firstName: "Janet",
        lastName: "Doe",
        email: "jane.doe01@email.com",
      };

      const res = await jane
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          username: "janedoe01",
          firstName: "Janet",
          lastName: "Doe",
          email: "jane.doe01@email.com",
        },
      });
    });

    test("update user last name", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doey",
        email: "jane.doe01@email.com",
      };

      const res = await jane
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          username: "janedoe01",
          firstName: "Jane",
          lastName: "Doey",
          email: "jane.doe01@email.com",
        },
      });
    });

    test("update user email", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doe",
        email: "janedoe@email.com",
      };

      const res = await jane
        .put("/api/users/4")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          username: "janedoe01",
          firstName: "Jane",
          lastName: "Doe",
          email: "janedoe@email.com",
        },
      });
    });

    test("returns forbidden when updating another user", async () => {
      const john = await createAuthenticatedAgent();

      const res = await john
        .put("/api/users/4")
        .send({
          firstName: "Janet",
          lastName: "Doe",
          email: "jane.doe01@email.com",
        })
        .set("Accept", "application/json");

      expect(res.status).toBe(403);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        message: "You can only update your own account",
      });

      // Jane's details are unchanged
      const check = await john.get("/api/users/4");
      expect(check.body).toMatchObject({ data: { id: 4, firstName: "Jane" } });
    });

    test("returns validation error for user ID type", async () => {
      const user = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe01@email.com",
      };

      const res = await jane
        .put("/api/users/abc")
        .send(user)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid user ID, expected number",
            path: "id",
            location: "params",
          },
        ],
      });
    });

    test("returns missing first name errors", async () => {
      const user = {
        lastName: "Doe",
        email: "janedoe@email.com",
      };

      const res = await jane
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

      const res = await jane
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

      const res = await jane
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

      const res = await jane
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

      const res = await jane
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

      const res = await jane
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

    describe("password change", () => {
      const OLD_PASSWORD = "Testpassword01!";
      const NEW_PASSWORD = "Newpassword02!";
      const janeDetails = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe01@email.com",
      };

      const loginStatus = async (password: string) => {
        const res = await createUnauthenticatedAgent()
          .post("/api/auth/login")
          .send({ username: "janedoe01", password });
        return res.status;
      };

      // Just the path and message of each validation error, in order
      const fieldErrors = (body: unknown) =>
        (
          (body as { errors?: { path: string; msg: string }[] }).errors ?? []
        ).map(({ path, msg }) => ({ path, msg }));

      test("changes the password when the current password is correct", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          currentPassword: OLD_PASSWORD,
          newPassword: NEW_PASSWORD,
          confirmNewPassword: NEW_PASSWORD,
        });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          success: true,
          data: { id: 4, username: "janedoe01", ...janeDetails },
        });
        expect(await loginStatus(NEW_PASSWORD)).toBe(200);
        expect(await loginStatus(OLD_PASSWORD)).toBe(401);
      });

      test("updates the name and password in one request", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          firstName: "Janet",
          currentPassword: OLD_PASSWORD,
          newPassword: NEW_PASSWORD,
          confirmNewPassword: NEW_PASSWORD,
        });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ data: { firstName: "Janet" } });
        expect(await loginStatus(NEW_PASSWORD)).toBe(200);
      });

      test("keeps the password when all password fields are blank", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          firstName: "Janet",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ data: { firstName: "Janet" } });
        expect(await loginStatus(OLD_PASSWORD)).toBe(200);
      });

      test("returns an error when the current password is incorrect", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          firstName: "Janet",
          currentPassword: "Wrongpassword01!",
          newPassword: NEW_PASSWORD,
          confirmNewPassword: NEW_PASSWORD,
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({
          success: false,
          errors: [
            {
              type: "field",
              path: "currentPassword",
              location: "body",
              msg: "Current password is incorrect",
            },
          ],
        });
        expect(await loginStatus(OLD_PASSWORD)).toBe(200);

        // Nothing else was saved either
        const check = await jane.get("/api/users/4");
        expect(check.body).toMatchObject({ data: { firstName: "Jane" } });
      });

      test("requires the current password to set a new one", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          newPassword: NEW_PASSWORD,
          confirmNewPassword: NEW_PASSWORD,
        });

        expect(res.status).toBe(400);
        expect(fieldErrors(res.body)).toEqual([
          { path: "currentPassword", msg: "Current password is required" },
        ]);
        expect(await loginStatus(OLD_PASSWORD)).toBe(200);
      });

      test("requires a new password when the current one is given", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          currentPassword: OLD_PASSWORD,
        });

        expect(res.status).toBe(400);
        expect(fieldErrors(res.body)).toEqual([
          { path: "newPassword", msg: "New password is required" },
          {
            path: "confirmNewPassword",
            msg: "Please confirm your new password",
          },
        ]);
      });

      test("returns an error when the confirmation does not match", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          currentPassword: OLD_PASSWORD,
          newPassword: NEW_PASSWORD,
          confirmNewPassword: "Different02!",
        });

        expect(res.status).toBe(400);
        expect(fieldErrors(res.body)).toEqual([
          { path: "confirmNewPassword", msg: "Passwords do not match" },
        ]);
        expect(await loginStatus(OLD_PASSWORD)).toBe(200);
      });

      test("returns an error when the new password is weak", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          currentPassword: OLD_PASSWORD,
          newPassword: "weak",
          confirmNewPassword: "weak",
        });

        expect(res.status).toBe(400);
        expect(fieldErrors(res.body)).toEqual([
          {
            path: "newPassword",
            msg: "Passwords must at least 8 characters long and contain an uppercase letter, number and symbol",
          },
        ]);
      });

      test("rejects a current password that is not a string", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          currentPassword: 12345678,
          newPassword: NEW_PASSWORD,
          confirmNewPassword: NEW_PASSWORD,
        });

        expect(res.status).toBe(400);
        expect(fieldErrors(res.body)).toEqual([
          { path: "currentPassword", msg: "Current password is required" },
        ]);
      });

      test("does not return the password in the response", async () => {
        const res = await jane.put("/api/users/4").send({
          ...janeDetails,
          currentPassword: OLD_PASSWORD,
          newPassword: NEW_PASSWORD,
          confirmNewPassword: NEW_PASSWORD,
        });

        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toMatch(/password/i);
      });
    });
  });

  describe("delete user endpoint", () => {
    // Jane is user 4, so these requests delete her own account
    const jane = createAuthenticatedAgentAs(4);

    test("soft delete user", async () => {
      const res = await jane.delete("/api/users/4");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 4,
          username: "janedoe01",
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe01@email.com",
        },
      });
    });

    test("returns 404 for a soft-deleted user", async () => {
      await jane.delete("/api/users/4").expect(200);

      const john = await createAuthenticatedAgent();
      const res = await john.get("/api/users/4");

      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });

    test("rejects the token of a deleted user", async () => {
      await jane.delete("/api/users/4").expect(200);

      const res = await jane.get("/api/users/1");

      expect(res.status).toBe(401);
    });

    test("returns forbidden when deleting another user", async () => {
      const john = await createAuthenticatedAgent();

      const res = await john.delete("/api/users/4");

      expect(res.status).toBe(403);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        message: "You can only delete your own account",
      });

      // Jane still exists
      await john.get("/api/users/4").expect(200);
    });

    test("returns validation error for user ID type", async () => {
      const res = await jane.delete("/api/users/abc");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid user ID, expected number",
            path: "id",
            location: "params",
          },
        ],
      });
    });
  });
});
