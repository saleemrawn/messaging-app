import conversation from "../src/routes/conversation-routes.ts";
import express, { type Express } from "express";
import request from "supertest";
import { populateDb, resetDbTables } from "./helpers/database.ts";
import { beforeEach, describe, expect, test } from "vitest";
import { anyString } from "./helpers/types.ts";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/conversations", conversation);

beforeEach(async () => {
  await resetDbTables();
  await populateDb();
});

describe("conversation route", () => {
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
});
