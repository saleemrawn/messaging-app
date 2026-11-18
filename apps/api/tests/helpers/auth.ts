import request from "supertest";
import { app } from "../../src/app.ts";

const createAuthenticatedAgent = async (
  username = "johndoe01",
  password = "Testpassword01!",
) => {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ username, password }).expect(200);
  return agent;
};

export { createAuthenticatedAgent };
