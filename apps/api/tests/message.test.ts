import {
  populateConversation,
  populateMessage,
  populateUser,
  populateUserAccount,
  populateUserConversation,
  resetDbTables,
} from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { isoDateString } from "./helpers/types.ts";
import {
  createAuthenticatedAgent,
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
  await populateConversation();
  await populateUserConversation();
  await populateMessage();
});

describe("message route", () => {
  describe("delete message route", () => {
    test("returns 401 without a token", async () => {
      const agent = createUnauthenticatedAgent();
      const res = await agent.delete("/api/messages/1");

      expect(res.status).toBe(401);
    });

    test("delete message", async () => {
      // Message 1 was sent by John (account 1)
      const agent = await createAuthenticatedAgent();
      const res = await agent.delete("/api/messages/1");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: { id: 1, deletedAt: isoDateString() },
      });
    });

    test("returns validation error for message ID type", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.delete("/api/messages/abc");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid param message ID, expected number",
            path: "id",
            location: "params",
          },
        ],
      });
    });

    test("returns message not found error for a message that does not exist", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.delete("/api/messages/9999");

      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        message: "Message not found",
      });
    });

    test("does not delete a message sent by another user", async () => {
      // Message 2 was sent by Aisha (account 2), so John cannot delete it
      const john = await createAuthenticatedAgent();
      const johnRes = await john.delete("/api/messages/2");

      expect(johnRes.status).toBe(404);
      expect(johnRes.body).toEqual({
        success: false,
        message: "Message not found",
      });

      // The message is untouched, so its owner can still delete it
      const aisha = createAuthenticatedAgentAs(2);
      const aishaRes = await aisha.delete("/api/messages/2");

      expect(aishaRes.status).toBe(200);
      expect(aishaRes.body).toEqual({
        success: true,
        data: { id: 2, deletedAt: isoDateString() },
      });
    });

    test("returns message not found error for an already deleted message", async () => {
      const agent = await createAuthenticatedAgent();
      await agent.delete("/api/messages/1").expect(200);

      const res = await agent.delete("/api/messages/1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Message not found",
      });
    });
  });
});
