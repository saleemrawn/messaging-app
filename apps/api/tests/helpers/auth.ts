import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app.ts";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const createAuthenticatedAgent = async (
  username = "johndoe01",
  password = "Testpassword01!",
) => {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ username, password }).expect(200);
  return agent;
};

// Agent with no credentials, for testing that protected routes return 401
const createUnauthenticatedAgent = () => request.agent(app);

// Agent authenticated as a given user account ID, without needing that
// user's password. Signs a token directly and sends it as a Bearer header.
const createAuthenticatedAgentAs = (userAccountId: number) => {
  const token = jwt.sign({ userId: userAccountId }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return request.agent(app).set("Authorization", `Bearer ${token}`);
};

export {
  createAuthenticatedAgent,
  createUnauthenticatedAgent,
  createAuthenticatedAgentAs,
};
