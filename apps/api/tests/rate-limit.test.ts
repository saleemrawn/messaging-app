import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import {
  populateConversation,
  populateUser,
  populateUserAccount,
  populateUserConversation,
  resetDbTables,
} from "./helpers/database.ts";
import {
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";
import { anyString } from "./helpers/types.ts";
import {
  ACCOUNT_LIMIT,
  AVATAR_UPLOAD_LIMIT,
  GLOBAL_IP_LIMIT,
  LOGIN_ATTEMPTS_BY_IP_LIMIT,
  LOGIN_FAILURES_BY_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_LIMIT,
  SEND_MESSAGE_LIMIT,
  SIGNUP_LIMIT,
} from "../src/rate-limit/rate-limit-config.ts";
import { resetRateLimiters } from "../src/rate-limit/limiters.ts";

const PASSWORD = "Testpassword01!";
const WRONG_PASSWORD = "Wrongpassword01!";

// Trusts one proxy hop, so each request can claim its client IP through
// X-Forwarded-For.
const proxiedApp = createApp({ trustProxy: 1 });

const loginFrom = (ip: string, username: string, password: string) =>
  request(proxiedApp)
    .post("/api/auth/login")
    .set("X-Forwarded-For", ip)
    .send({ username, password });

// Sends `count` requests one after another and returns the last response.
const repeat = async (count: number, send: () => request.Test) => {
  let res = await send();
  for (let i = 1; i < count; i++) {
    res = await send();
  }
  return res;
};

const expectTooManyRequests = (res: request.Response) => {
  expect(res.status).toBe(429);
  expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
  expect(res.body).toEqual({ success: false, message: anyString() });
};

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
  await populateConversation();
  await populateUserConversation();
});

describe("login rate limits", () => {
  test("blocks a username from an IP after repeated wrong passwords, even with the right password", async () => {
    await repeat(LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT.points, () =>
      loginFrom("203.0.113.1", "johndoe01", WRONG_PASSWORD).expect(401),
    );

    const res = await loginFrom("203.0.113.1", "johndoe01", PASSWORD);

    expectTooManyRequests(res);
  });

  test("still lets the same user log in from another IP", async () => {
    await repeat(LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT.points, () =>
      loginFrom("203.0.113.1", "johndoe01", WRONG_PASSWORD).expect(401),
    );

    await loginFrom("203.0.113.2", "johndoe01", PASSWORD).expect(200);
  });

  test("a successful login resets the username and IP failure count", async () => {
    const almostBlocked = LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT.points - 1;

    await repeat(almostBlocked, () =>
      loginFrom("203.0.113.1", "johndoe01", WRONG_PASSWORD).expect(401),
    );
    await loginFrom("203.0.113.1", "johndoe01", PASSWORD).expect(200);
    await repeat(almostBlocked, () =>
      loginFrom("203.0.113.1", "johndoe01", WRONG_PASSWORD).expect(401),
    );

    await loginFrom("203.0.113.1", "johndoe01", PASSWORD).expect(200);
  });

  test("treats usernames case-insensitively when counting failures", async () => {
    await repeat(LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT.points, () =>
      loginFrom("203.0.113.1", "JohnDoe01", WRONG_PASSWORD).expect(401),
    );

    const res = await loginFrom("203.0.113.1", "johndoe01", PASSWORD);

    expectTooManyRequests(res);
  });

  test("blocks a username targeted from many IPs", async () => {
    // A different IP each time stays under the username and IP limit.
    for (let i = 0; i < LOGIN_FAILURES_BY_USERNAME_LIMIT.points; i++) {
      await loginFrom(`198.51.100.${String(i)}`, "johndoe01", WRONG_PASSWORD)
        .expect(401);
    }

    const res = await loginFrom("192.0.2.1", "johndoe01", PASSWORD);

    expectTooManyRequests(res);
  });

  test("blocks an IP that fails across many usernames", async () => {
    const failures = LOGIN_FAILURES_BY_IP_LIMIT.points;
    const batchSize = LOGIN_ATTEMPTS_BY_IP_LIMIT.points;

    for (let sent = 0; sent < failures; sent += batchSize) {
      // Stands in for a minute passing: clears the in-memory per-minute
      // attempt limit, which would otherwise trip first. The failure
      // counters are in Postgres and keep counting.
      resetRateLimiters();
      const batch = Math.min(batchSize, failures - sent);
      for (let i = 0; i < batch; i++) {
        await loginFrom(
          "203.0.113.9",
          `stuffed-user-${String(sent + i)}`,
          WRONG_PASSWORD,
        ).expect(401);
      }
    }
    resetRateLimiters();

    const res = await loginFrom("203.0.113.9", "johndoe01", PASSWORD);

    expectTooManyRequests(res);
  });

  test("limits login attempts per IP per minute, whatever the outcome", async () => {
    await repeat(LOGIN_ATTEMPTS_BY_IP_LIMIT.points, () =>
      loginFrom("203.0.113.5", "johndoe01", PASSWORD).expect(200),
    );

    const res = await loginFrom("203.0.113.5", "johndoe01", PASSWORD);

    expectTooManyRequests(res);
  });

  test("groups IPv6 clients in the same /64", async () => {
    await repeat(LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT.points - 1, () =>
      loginFrom("2001:db8:1:2::1", "johndoe01", WRONG_PASSWORD).expect(401),
    );
    await loginFrom("2001:db8:1:2::ffff", "johndoe01", WRONG_PASSWORD).expect(
      401,
    );

    const res = await loginFrom("2001:db8:1:2::abcd", "johndoe01", PASSWORD);

    expectTooManyRequests(res);
  });
});

describe("signup rate limit", () => {
  test("limits signups per IP", async () => {
    await repeat(SIGNUP_LIMIT.points, () =>
      request(proxiedApp)
        .post("/api/users")
        .set("X-Forwarded-For", "203.0.113.20")
        .send({}),
    );

    const res = await request(proxiedApp)
      .post("/api/users")
      .set("X-Forwarded-For", "203.0.113.20")
      .send({
        firstName: "Antoine",
        lastName: "Doe",
        email: "antoine.doe01@email.com",
        username: "antoinedoe01",
        password: "Money0987!",
      });

    expectTooManyRequests(res);
  });
});

describe("authenticated rate limits", () => {
  test("limits requests per account", async () => {
    const agent = createAuthenticatedAgentAs(1);
    await repeat(ACCOUNT_LIMIT.points, () => agent.get("/api/contacts"));

    const res = await agent.get("/api/contacts");

    expectTooManyRequests(res);
  });

  test("an account over its limit doesn't affect another account", async () => {
    const agent = createAuthenticatedAgentAs(1);
    await repeat(ACCOUNT_LIMIT.points + 1, () => agent.get("/api/contacts"));

    await createAuthenticatedAgentAs(2).get("/api/contacts").expect(200);
  });

  test("limits sending messages per account", async () => {
    const agent = createAuthenticatedAgentAs(1);
    await repeat(SEND_MESSAGE_LIMIT.points, () =>
      agent
        .post("/api/conversations/1/messages")
        .send({ content: "Hi", recipientId: 2 })
        .expect(201),
    );

    const res = await agent
      .post("/api/conversations/1/messages")
      .send({ content: "Hi", recipientId: 2 });

    expectTooManyRequests(res);
  });

  test("limits avatar uploads per account", async () => {
    const agent = createAuthenticatedAgentAs(1);
    // Rejected uploads (no file) still count, since parsing costs the same.
    await repeat(AVATAR_UPLOAD_LIMIT.points, () =>
      agent.put("/api/users/1/avatar"),
    );

    const res = await agent.put("/api/users/1/avatar");

    expectTooManyRequests(res);
  });
});

describe("global IP rate limit", () => {
  test("limits all requests from one IP and keeps CORS headers on the 429", async () => {
    const origin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
    const send = () =>
      request(proxiedApp)
        .post("/api/auth/logout")
        .set("X-Forwarded-For", "203.0.113.30")
        .set("Origin", origin);
    await repeat(GLOBAL_IP_LIMIT.points, send);

    const res = await send();

    expectTooManyRequests(res);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
  });

  test("counts unauthenticated requests too", async () => {
    const agent = createUnauthenticatedAgent();
    await repeat(GLOBAL_IP_LIMIT.points, () => agent.get("/api/contacts"));

    const res = await agent.get("/api/contacts");

    expectTooManyRequests(res);
  });
});
