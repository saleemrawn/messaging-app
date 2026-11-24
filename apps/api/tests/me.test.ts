import { beforeEach, describe, expect, test } from "vitest";
import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import {
  createAuthenticatedAgent,
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

describe("GET /api/auth/me", () => {
  test("returns the current user when authenticated via cookie", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.get("/api/auth/me");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        id: 1,
        username: "johndoe01",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe01@email.com",
      },
    });
  });

  test("returns the current user when authenticated via bearer token", async () => {
    const agent = createAuthenticatedAgentAs(2);

    const res = await agent.get("/api/auth/me");

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { id: 2, username: "aishadoe01" },
    });
  });

  test("never includes the password in the response", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.get("/api/auth/me");

    expect(JSON.stringify(res.body)).not.toContain("password");
  });

  test("returns 401 when not authenticated", async () => {
    const agent = createUnauthenticatedAgent();

    const res = await agent.get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });

  test("returns 401 when the token is malformed", async () => {
    const agent = createUnauthenticatedAgent().set(
      "Authorization",
      "Bearer not-a-real-token",
    );

    const res = await agent.get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });

  test("returns 401 when the token belongs to a deleted account", async () => {
    const agent = createAuthenticatedAgentAs(999);

    const res = await agent.get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });
});

describe("CORS", () => {
  test("allows credentialed requests from the client origin", async () => {
    const origin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
    const agent = createUnauthenticatedAgent();

    const res = await agent
      .options("/api/auth/me")
      .set("Origin", origin)
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(origin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});
