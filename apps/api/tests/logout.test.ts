import { beforeEach, describe, expect, test } from "vitest";
import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import {
  createAuthenticatedAgent,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

function findTokenCookie(headers: Record<string, unknown>): string | undefined {
  const setCookie = headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? (setCookie as string[]) : [];
  return cookies.find((cookie) => cookie.startsWith("token="));
}

describe("POST /api/auth/logout", () => {
  test("clears the httpOnly token cookie", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.post("/api/auth/logout");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Logged out" });
    const tokenCookie = findTokenCookie(res.headers);
    expect(tokenCookie).toMatch(/^token=;/);
    expect(tokenCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(tokenCookie).toMatch(/HttpOnly/);
  });

  test("ends the cookie session so /me returns 401 afterwards", async () => {
    const agent = await createAuthenticatedAgent();
    await agent.get("/api/auth/me").expect(200);

    await agent.post("/api/auth/logout").expect(200);
    const res = await agent.get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });

  test("succeeds even when the caller is not authenticated", async () => {
    const agent = createUnauthenticatedAgent();

    const res = await agent.post("/api/auth/logout");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Logged out" });
  });
});
