import conversation from "../src/routes/conversation-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import {
  populateConversation,
  populateMessage,
  populateUser,
  populateUserAccount,
  populateUserConversation,
  resetDbTables,
} from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { anyString } from "./helpers/types.ts";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/conversations", conversation);

beforeEach(async () => {
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

describe("conversation route", () => {
  describe("get conversations by user account ID route", () => {
    test("returns conversations from user account ID", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app)
        .get("/api/conversations")
        .send({ userAccountId: 1 });

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: [
          {
            id: 2,
            updatedAt: "2026-01-01T21:10:00.000Z",
            userConversations: [
              {
                userAccount: {
                  id: 3,
                  deletedAt: null,
                  user: { firstName: "Phillipe", lastName: "Doe" },
                },
              },
            ],
            messages: [
              {
                id: 3,
                content: "Sed do eiusmod tempor incididunt",
                createdAt: "2026-01-01T21:00:00.000Z",
              },
              {
                id: 4,
                content: "Labore et dolore magna aliqua",
                createdAt: "2026-01-01T21:10:00.000Z",
              },
            ],
          },
          {
            id: 1,
            updatedAt: "2026-01-01T20:10:00.000Z",
            userConversations: [
              {
                userAccount: {
                  id: 2,
                  deletedAt: null,
                  user: { firstName: "Aisha", lastName: "Doe" },
                },
              },
            ],
            messages: [
              {
                id: 1,
                content: "Lorem ipsum dolor sit amet",
                createdAt: "2026-01-01T20:00:00.000Z",
              },
              {
                id: 2,
                content: "Consectetur adipiscing elit",
                createdAt: "2026-01-01T20:10:00.000Z",
              },
            ],
          },
        ],
      });
    });

    test("returns empty array for no conversations", async () => {
      const res = await request(app)
        .get("/api/conversations")
        .send({ userAccountId: 1 });

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: true, data: [] });
    });

    test("returns validation errors for invalid user account ID", async () => {
      const res = await request(app).get("/api/conversations").send({});

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "User account ID is required",
            path: "userAccountId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid user account ID, expected number",
            path: "userAccountId",
            location: "body",
          },
        ],
      });
    });
  });

  describe("get conversation by ID route", () => {
    test("returns a conversation by ID", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app).get("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 1,
          updatedAt: "2026-01-01T20:10:00.000Z",
          messages: [
            {
              id: 1,
              content: "Lorem ipsum dolor sit amet",
              createdAt: "2026-01-01T20:00:00.000Z",
              userAccount: {
                id: 1,
                deletedAt: null,
                user: { id: 1, firstName: "John", lastName: "Doe" },
              },
            },
            {
              id: 2,
              content: "Consectetur adipiscing elit",
              createdAt: "2026-01-01T20:10:00.000Z",
              userAccount: {
                id: 2,
                deletedAt: null,
                user: { id: 2, firstName: "Aisha", lastName: "Doe" },
              },
            },
          ],
        },
      });
    });

    test("returns conversation not found error", async () => {
      const res = await request(app).get("/api/conversations/9999");

      expect(res.status).toBe(404);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        message: "Conversation not found",
      });
    });
  });

  describe("create conversation endpoint", () => {
    test("create a conversation", async () => {
      const conversation = {
        content: "Hello, how is it going?",
        senderId: 1,
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations")
        .send(conversation)
        .set("Accept", "application/json");

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 1,
          messages: [
            {
              id: 1,
              content: "Hello, how is it going?",
              createdAt: anyString(),
            },
          ],
          userConversations: [
            { id: 1, unreadCount: 0 },
            { id: 2, unreadCount: 1 },
          ],
        },
      });
    });

    test("returns missing content error", async () => {
      const conversation = {
        content: "",
        senderId: 1,
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations")
        .send(conversation)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Message content required",
            path: "content",
            location: "body",
          },
        ],
      });
    });

    test("returns missing sender ID errors", async () => {
      const conversation = {
        content: "Hello, how is it going?",
        senderId: null,
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations")
        .send(conversation)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Sender ID is required",
            path: "senderId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid sender ID, expected number",
            path: "senderId",
            location: "body",
          },
        ],
      });
    });

    test("returns missing recipient ID errors", async () => {
      const conversation = {
        content: "Hello, how is it going?",
        senderId: 1,
        recipientId: null,
      };

      const res = await request(app)
        .post("/api/conversations")
        .send(conversation)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Recipient ID is required",
            path: "recipientId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid recipient ID, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid sender ID error", async () => {
      const conversation = {
        content: "Hello, how is it going?",
        senderId: "abc",
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations")
        .send(conversation)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid sender ID, expected number",
            path: "senderId",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid recipient ID error", async () => {
      const conversation = {
        content: "Hello, how is it going?",
        senderId: 1,
        recipientId: "abc",
      };

      const res = await request(app)
        .post("/api/conversations")
        .send(conversation)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid recipient ID, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });
  });

  describe("delete conversation route", () => {
    test("delete conversation with ID", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app).delete("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: { id: 1, deletedAt: anyString() },
      });
    });

    test("returns validation error for conversation ID type", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app).delete("/api/conversations/abc");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid conversation ID, expected number",
            path: "id",
            location: "params",
          },
        ],
      });
    });
  });

  describe("add message to conversation endpoint", () => {
    test("add message to conversation", async () => {
      await request(app)
        .post("/api/conversations")
        .send({
          content: "Hello, how is it going?",
          senderId: 1,
          recipientId: 2,
        })
        .set("Accept", "application/json")
        .expect(201);

      const message = {
        content: "I'm doing well thanks!",
        senderId: 2,
        recipientId: 1,
      };

      const res = await request(app)
        .post("/api/conversations/1/messages")
        .send(message)
        .set("Accept", "application/json");

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 1,
          userConversations: [
            { id: 1, unreadCount: 1 },
            { id: 2, unreadCount: 0 },
          ],
          messages: [
            {
              id: 1,
              content: "Hello, how is it going?",
              createdAt: anyString(),
            },
            {
              id: 2,
              content: "I'm doing well thanks!",
              createdAt: anyString(),
            },
          ],
        },
      });
    });

    test("returns missing content error", async () => {
      const message = {
        content: "",
        senderId: 1,
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations/1/messages")
        .send(message)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Message content required",
            path: "content",
            location: "body",
          },
        ],
      });
    });

    test("returns missing sender ID errors", async () => {
      const message = {
        content: "Hello, how is it going?",
        senderId: null,
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations/1/messages")
        .send(message)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Sender ID is required",
            path: "senderId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid sender ID, expected number",
            path: "senderId",
            location: "body",
          },
        ],
      });
    });

    test("returns missing recipient ID errors", async () => {
      const message = {
        content: "Hello, how is it going?",
        senderId: 1,
        recipientId: null,
      };

      const res = await request(app)
        .post("/api/conversations/1/messages")
        .send(message)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "Recipient ID is required",
            path: "recipientId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid recipient ID, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid sender ID error", async () => {
      const message = {
        content: "Hello, how is it going?",
        senderId: "abc",
        recipientId: 2,
      };

      const res = await request(app)
        .post("/api/conversations/1/messages")
        .send(message)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid sender ID, expected number",
            path: "senderId",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid recipient ID error", async () => {
      const message = {
        content: "Hello, how is it going?",
        senderId: 1,
        recipientId: "abc",
      };

      const res = await request(app)
        .post("/api/conversations/1/messages")
        .send(message)
        .set("Accept", "application/json");

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid recipient ID, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });
  });

  describe("add message receipts for conversation endpoint", () => {
    test("add message receipts for a user", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app)
        .post("/api/conversations/1/messages/receipts")
        .send({ messageIds: [1], userAccountId: 2 });

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            messageId: 1,
            userAccountId: 2,
            readAt: anyString(),
          },
        ],
      });
    });

    test("returns validation error for missing message IDs", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app)
        .post("/api/conversations/1/messages/receipts")
        .send({ messageIds: [], userAccountId: 2 });

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: [],
            msg: "One or more message IDs is required",
            path: "messageIds",
            location: "body",
          },
        ],
      });
    });

    test("returns validation error for incorrect message IDs type", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app)
        .post("/api/conversations/1/messages/receipts")
        .send({ messageIds: ["a", "b", "c"], userAccountId: 2 });

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "a",
            msg: "Each message ID must be a positive integer",
            path: "messageIds[0]",
            location: "body",
          },
          {
            type: "field",
            value: "b",
            msg: "Each message ID must be a positive integer",
            path: "messageIds[1]",
            location: "body",
          },
          {
            type: "field",
            value: "c",
            msg: "Each message ID must be a positive integer",
            path: "messageIds[2]",
            location: "body",
          },
        ],
      });
    });

    test("returns validation errors for missing user account ID", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app)
        .post("/api/conversations/1/messages/receipts")
        .send({ messageIds: [1] });

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "",
            msg: "User account ID is required",
            path: "userAccountId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid user account ID, expected number",
            path: "userAccountId",
            location: "body",
          },
        ],
      });
    });

    test("returns validation errors for incorrect user account ID type", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const res = await request(app)
        .post("/api/conversations/1/messages/receipts")
        .send({ messageIds: [1], userAccountId: "abc" });

      expect(res.status).toBe(400);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: false,
        errors: [
          {
            type: "field",
            value: "abc",
            msg: "Invalid user account ID, expected number",
            path: "userAccountId",
            location: "body",
          },
        ],
      });
    });
  });
});
