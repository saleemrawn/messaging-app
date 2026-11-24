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
import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma.ts";
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

// Conversation 1 as John (account 1) sees it after sending "Hello" to Aisha
const helloConversationFromJohn = (readAt: unknown) => ({
  success: true,
  data: {
    id: 1,
    updatedAt: isoDateString(),
    recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
    messages: [
      {
        id: 1,
        content: "Hello",
        createdAt: isoDateString(),
        senderId: 1,
        readAt,
      },
    ],
  },
});

// What Aisha (account 2) should see in her conversation list
const aishaConversationList = {
  success: true,
  data: [
    {
      id: 1,
      updatedAt: "2026-01-01T20:10:00.000Z",
      unreadCount: 0,
      recipient: { id: 1, firstName: "John", lastName: "Doe" },
      latestMessage: {
        id: 2,
        content: "Consectetur adipiscing elit",
        createdAt: "2026-01-01T20:10:00.000Z",
        senderId: 2,
      },
    },
  ],
};

// What John (account 1) should see in his conversation list, newest first
const johnConversationList = {
  success: true,
  data: [
    {
      id: 2,
      updatedAt: "2026-01-01T21:10:00.000Z",
      unreadCount: 0,
      recipient: { id: 3, firstName: "Phillipe", lastName: "Doe" },
      latestMessage: {
        id: 4,
        content: "Labore et dolore magna aliqua",
        createdAt: "2026-01-01T21:10:00.000Z",
        senderId: 3,
      },
    },
    {
      id: 1,
      updatedAt: "2026-01-01T20:10:00.000Z",
      unreadCount: 0,
      recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
      latestMessage: {
        id: 2,
        content: "Consectetur adipiscing elit",
        createdAt: "2026-01-01T20:10:00.000Z",
        senderId: 2,
      },
    },
  ],
};

interface ConversationListBody {
  data: { id: number; updatedAt: string }[];
}

const listedConversations = (body: unknown) =>
  (body as ConversationListBody).data;

const listedConversation = (body: unknown, id: number) =>
  listedConversations(body).find((conversation) => conversation.id === id);

describe("conversation route", () => {
  describe("authentication", () => {
    const routes: ["get" | "post" | "delete", string][] = [
      ["get", "/api/conversations"],
      ["get", "/api/conversations/unread-count"],
      ["get", "/api/conversations/1"],
      ["post", "/api/conversations"],
      ["delete", "/api/conversations/1"],
      ["post", "/api/conversations/1/messages"],
      ["post", "/api/conversations/1/messages/receipts"],
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

  describe("get conversations for the authenticated user route", () => {
    test("returns conversations for the authenticated user", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual(johnConversationList);
    });

    test("only returns conversations the authenticated user belongs to", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = createAuthenticatedAgentAs(2);
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual(aishaConversationList);
    });

    test("ignores a userAccountId in the request body", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = createAuthenticatedAgentAs(2);
      const res = await agent
        .get("/api/conversations")
        .send({ userAccountId: 1 });

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual(aishaConversationList);
    });

    test("returns empty array for no conversations", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: true, data: [] });
    });

    test("returns the authenticated user's unread count", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await prisma.userConversation.updateMany({
        where: { userAccountId: 1, conversationId: 2 },
        data: { unreadCount: 3 },
      });
      await prisma.userConversation.updateMany({
        where: { userAccountId: 3, conversationId: 2 },
        data: { unreadCount: 7 },
      });

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(listedConversation(res.body, 2)).toMatchObject({ unreadCount: 3 });
      expect(listedConversation(res.body, 1)).toMatchObject({ unreadCount: 0 });
    });

    test("latest message skips soft-deleted messages", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await prisma.message.update({
        where: { id: 4 },
        data: { deletedAt: new Date() },
      });

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(listedConversation(res.body, 2)).toMatchObject({
        latestMessage: {
          id: 3,
          content: "Sed do eiusmod tempor incididunt",
          createdAt: "2026-01-01T21:00:00.000Z",
          senderId: 1,
        },
      });
    });

    test("latest message is null when a conversation has no messages", async () => {
      await populateConversation();
      await populateUserConversation();

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(listedConversation(res.body, 1)).toMatchObject({
        latestMessage: null,
      });
      expect(listedConversation(res.body, 2)).toMatchObject({
        latestMessage: null,
      });
    });

    test("excludes soft-deleted conversations", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = await createAuthenticatedAgent();
      await agent.delete("/api/conversations/2").expect(200);
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: [johnConversationList.data[1]],
      });
    });

    test("moves a conversation to the top when a message is added", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = await createAuthenticatedAgent();
      await agent
        .post("/api/conversations/1/messages")
        .send({ content: "Bump", recipientId: 2 })
        .expect(201);
      const res = await agent.get("/api/conversations");

      expect(res.status).toBe(200);
      const [newest] = listedConversations(res.body);
      expect(newest).toMatchObject({
        id: 1,
        latestMessage: { content: "Bump", senderId: 1 },
      });
      expect(newest.updatedAt).not.toBe("2026-01-01T20:10:00.000Z");
    });
  });

  describe("get unread count route", () => {
    const setUnreadCounts = async () => {
      await prisma.userConversation.updateMany({
        where: { userAccountId: 1, conversationId: 1 },
        data: { unreadCount: 2 },
      });
      await prisma.userConversation.updateMany({
        where: { userAccountId: 1, conversationId: 2 },
        data: { unreadCount: 3 },
      });
      await prisma.userConversation.updateMany({
        where: { userAccountId: 3, conversationId: 2 },
        data: { unreadCount: 7 },
      });
    };

    test("returns the sum of the authenticated user's unread counts", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await setUnreadCounts();

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations/unread-count");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: true, data: { unreadCount: 5 } });
    });

    test("excludes soft-deleted conversations", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await setUnreadCounts();

      const agent = await createAuthenticatedAgent();
      await agent.delete("/api/conversations/2").expect(200);
      const res = await agent.get("/api/conversations/unread-count");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { unreadCount: 2 } });
    });

    test("returns zero when the user has no conversations", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations/unread-count");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { unreadCount: 0 } });
    });
  });

  describe("get conversation by ID route", () => {
    test("returns the conversation as the authenticated user sees it", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 1,
          updatedAt: "2026-01-01T20:10:00.000Z",
          recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
          messages: [
            {
              id: 1,
              content: "Lorem ipsum dolor sit amet",
              createdAt: "2026-01-01T20:00:00.000Z",
              senderId: 1,
              readAt: null,
            },
            {
              id: 2,
              content: "Consectetur adipiscing elit",
              createdAt: "2026-01-01T20:10:00.000Z",
              senderId: 2,
              readAt: null,
            },
          ],
        },
      });
    });

    test("the recipient is the other participant for either member", async () => {
      await populateConversation();
      await populateUserConversation();

      const aisha = createAuthenticatedAgentAs(2);
      const res = await aisha.get("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: { recipient: { id: 1, firstName: "John", lastName: "Doe" } },
      });
    });

    test("sets readAt once the other participant has read the message", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      // Aisha (account 2) reads conversation 1, which only covers John's message
      const aisha = createAuthenticatedAgentAs(2);
      await aisha.post("/api/conversations/1/messages/receipts").expect(201);

      const john = await createAuthenticatedAgent();
      const res = await john.get("/api/conversations/1");

      expect(res.body).toMatchObject({
        data: {
          messages: [
            { id: 1, senderId: 1, readAt: isoDateString() },
            { id: 2, senderId: 2, readAt: null },
          ],
        },
      });
    });

    test("excludes soft-deleted messages", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await prisma.message.update({
        where: { id: 2 },
        data: { deletedAt: new Date() },
      });

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ data: { messages: [{ id: 1 }] } });
      expect(
        (res.body as { data: { messages: unknown[] } }).data.messages,
      ).toHaveLength(1);
    });

    test("returns not found for a conversation the user does not belong to", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      // Jane (account 4) is not in conversation 1
      const jane = createAuthenticatedAgentAs(4);
      const res = await jane.get("/api/conversations/1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Conversation not found",
      });
    });

    test("returns not found for a soft-deleted conversation", async () => {
      await populateConversation();
      await populateUserConversation();
      await prisma.conversation.update({
        where: { id: 1 },
        data: { deletedAt: new Date() },
      });

      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations/1");

      expect(res.status).toBe(404);
    });

    test("returns conversation not found error", async () => {
      const agent = await createAuthenticatedAgent();
      const res = await agent.get("/api/conversations/9999");

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
      const agent = await createAuthenticatedAgent();

      const conversation = {
        content: "Hello, how is it going?",
        recipientId: 2,
      };

      const res = await agent.post("/api/conversations").send(conversation);

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({ success: true, data: { id: 1 } });

      // A first message makes it visible and unread for the recipient
      const aisha = createAuthenticatedAgentAs(2);
      const list = await aisha.get("/api/conversations");
      expect(list.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            updatedAt: isoDateString(),
            unreadCount: 1,
            recipient: { id: 1, firstName: "John", lastName: "Doe" },
            latestMessage: {
              id: 1,
              content: "Hello, how is it going?",
              createdAt: isoDateString(),
              senderId: 1,
            },
          },
        ],
      });
    });

    test("creates an empty conversation when no content is given", async () => {
      const john = await createAuthenticatedAgent();

      const res = await john
        .post("/api/conversations")
        .send({ recipientId: 2 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true, data: { id: 1 } });

      const list = await john.get("/api/conversations");
      expect(list.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            updatedAt: isoDateString(),
            unreadCount: 0,
            recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
            latestMessage: null,
          },
        ],
      });

      const detail = await john.get("/api/conversations/1");
      expect(detail.status).toBe(200);
      expect(detail.body).toEqual({
        success: true,
        data: {
          id: 1,
          updatedAt: isoDateString(),
          recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
          messages: [],
        },
      });
    });

    test("hides an empty conversation from the recipient", async () => {
      const john = await createAuthenticatedAgent();
      await john
        .post("/api/conversations")
        .send({ recipientId: 2 })
        .expect(201);

      const aisha = createAuthenticatedAgentAs(2);
      const list = await aisha.get("/api/conversations");
      const unread = await aisha.get("/api/conversations/unread-count");

      expect(list.body).toEqual({ success: true, data: [] });
      expect(unread.body).toEqual({ success: true, data: { unreadCount: 0 } });
    });

    test("shows the conversation to the recipient once a message is sent", async () => {
      const john = await createAuthenticatedAgent();
      await john
        .post("/api/conversations")
        .send({ recipientId: 2 })
        .expect(201);
      await john
        .post("/api/conversations/1/messages")
        .send({ content: "Hi Aisha", recipientId: 2 })
        .expect(201);

      const aisha = createAuthenticatedAgentAs(2);
      const list = await aisha.get("/api/conversations");

      expect(list.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            updatedAt: isoDateString(),
            unreadCount: 1,
            recipient: { id: 1, firstName: "John", lastName: "Doe" },
            latestMessage: {
              id: 1,
              content: "Hi Aisha",
              createdAt: isoDateString(),
              senderId: 1,
            },
          },
        ],
      });
    });

    test("returns the existing conversation instead of creating a duplicate", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      const john = await createAuthenticatedAgent();

      const res = await john
        .post("/api/conversations")
        .send({ recipientId: 2 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { id: 1 } });
      expect(await prisma.conversation.count()).toBe(2);
    });

    test("returns the existing conversation when either member starts it", async () => {
      await populateConversation();
      await populateUserConversation();
      const aisha = createAuthenticatedAgentAs(2);

      const res = await aisha
        .post("/api/conversations")
        .send({ recipientId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { id: 1 } });
    });

    test("ignores a soft-deleted conversation with the same recipient", async () => {
      await populateConversation();
      await populateUserConversation();
      await prisma.conversation.update({
        where: { id: 1 },
        data: { deletedAt: new Date() },
      });
      const john = await createAuthenticatedAgent();

      const res = await john
        .post("/api/conversations")
        .send({ recipientId: 2 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true, data: { id: 3 } });
    });

    test("reveals a hidden conversation to the recipient when they open it", async () => {
      const john = await createAuthenticatedAgent();
      await john
        .post("/api/conversations")
        .send({ recipientId: 2 })
        .expect(201);
      const aisha = createAuthenticatedAgentAs(2);

      const res = await aisha
        .post("/api/conversations")
        .send({ recipientId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { id: 1 } });

      const list = await aisha.get("/api/conversations");
      expect(listedConversation(list.body, 1)).toBeDefined();
    });

    test("returns an error when starting a conversation with yourself", async () => {
      const john = await createAuthenticatedAgent();

      const res = await john
        .post("/api/conversations")
        .send({ recipientId: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: "You can't start a conversation with yourself",
      });
      expect(await prisma.conversation.count()).toBe(0);
    });

    test("returns not found for an unknown recipient", async () => {
      const john = await createAuthenticatedAgent();

      const res = await john
        .post("/api/conversations")
        .send({ recipientId: 999 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "User not found" });
      expect(await prisma.conversation.count()).toBe(0);
    });

    test("returns not found for a soft-deleted recipient", async () => {
      await createAuthenticatedAgentAs(4).delete("/api/users/4").expect(200);
      const john = await createAuthenticatedAgent();

      const res = await john
        .post("/api/conversations")
        .send({ recipientId: 4 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: "User not found" });
    });

    test("uses the authenticated user as sender and ignores a senderId in the body", async () => {
      const agent = await createAuthenticatedAgent();

      await agent
        .post("/api/conversations")
        .send({
          content: "Hello, how is it going?",
          senderId: 3,
          recipientId: 2,
        })
        .expect(201);

      const res = await agent.get("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 1,
          updatedAt: isoDateString(),
          recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
          messages: [
            {
              id: 1,
              content: "Hello, how is it going?",
              createdAt: isoDateString(),
              senderId: 1,
              readAt: null,
            },
          ],
        },
      });
    });

    test("returns missing content error", async () => {
      const agent = await createAuthenticatedAgent();

      const conversation = {
        content: "",
        recipientId: 2,
      };

      const res = await agent
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
            msg: "Message required",
            path: "content",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Message must be between 1 and 5,000 characters",
            path: "content",
            location: "body",
          },
        ],
      });
    });

    test("returns message max. length error", async () => {
      const agent = await createAuthenticatedAgent();
      const randomText = faker.lorem.words(2000);

      const conversation = {
        content: randomText,
        recipientId: 2,
      };

      const res = await agent
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
            value: randomText,
            msg: "Message must be between 1 and 5,000 characters",
            path: "content",
            location: "body",
          },
        ],
      });
    });

    test("returns missing recipient ID errors", async () => {
      const agent = await createAuthenticatedAgent();
      const conversation = {
        content: "Hello, how is it going?",
        recipientId: null,
      };

      const res = await agent
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
            msg: "recipientId is required",
            path: "recipientId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid recipientId, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid recipient ID error", async () => {
      const agent = await createAuthenticatedAgent();
      const conversation = {
        content: "Hello, how is it going?",
        recipientId: "abc",
      };

      const res = await agent
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
            msg: "Invalid recipientId, expected number",
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

      const agent = await createAuthenticatedAgent();
      const res = await agent.delete("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: { id: 1, deletedAt: isoDateString() },
      });
    });

    test("returns validation error for conversation ID type", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = await createAuthenticatedAgent();
      const res = await agent.delete("/api/conversations/abc");

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
      const john = await createAuthenticatedAgent();
      await john
        .post("/api/conversations")
        .send({
          content: "Hello, how is it going?",
          recipientId: 2,
        })
        .set("Accept", "application/json")
        .expect(201);

      // Aisha (account 2) replies to John
      const aisha = createAuthenticatedAgentAs(2);
      const message = {
        content: "I'm doing well thanks!",
        recipientId: 1,
      };

      const res = await aisha
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
              createdAt: isoDateString(),
            },
            {
              id: 2,
              content: "I'm doing well thanks!",
              createdAt: isoDateString(),
            },
          ],
        },
      });
    });

    test("uses the authenticated user as sender and ignores a senderId in the body", async () => {
      await populateConversation();
      await populateUserConversation();

      const agent = await createAuthenticatedAgent();
      await agent
        .post("/api/conversations/1/messages")
        .send({ content: "Hello", senderId: 2, recipientId: 2 })
        .set("Accept", "application/json")
        .expect(201);

      const res = await agent.get("/api/conversations/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(helloConversationFromJohn(null));
    });

    test("returns not found for a conversation the user does not belong to", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      // Jane (account 4) is not in conversation 1
      const jane = createAuthenticatedAgentAs(4);
      const res = await jane
        .post("/api/conversations/1/messages")
        .send({ content: "Let me in", recipientId: 1 })
        .set("Accept", "application/json");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Conversation not found",
      });
      expect(await prisma.message.count({ where: { conversationId: 1 } })).toBe(
        2,
      );
    });

    test("returns missing content error", async () => {
      const message = {
        content: "",
        recipientId: 2,
      };

      const agent = await createAuthenticatedAgent();
      const res = await agent
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
            msg: "Message required",
            path: "content",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Message must be between 1 and 5,000 characters",
            path: "content",
            location: "body",
          },
        ],
      });
    });

    test("returns message max. length error", async () => {
      const randomText = faker.lorem.words(2000);

      const message = {
        content: randomText,
        recipientId: 2,
      };

      const agent = await createAuthenticatedAgent();
      const res = await agent
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
            value: randomText,
            msg: "Message must be between 1 and 5,000 characters",
            path: "content",
            location: "body",
          },
        ],
      });
    });

    test("returns missing recipient ID errors", async () => {
      const message = {
        content: "Hello, how is it going?",
        recipientId: null,
      };

      const agent = await createAuthenticatedAgent();
      const res = await agent
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
            msg: "recipientId is required",
            path: "recipientId",
            location: "body",
          },
          {
            type: "field",
            value: "",
            msg: "Invalid recipientId, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });

    test("returns invalid recipient ID error", async () => {
      const message = {
        content: "Hello, how is it going?",
        recipientId: "abc",
      };

      const agent = await createAuthenticatedAgent();
      const res = await agent
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
            msg: "Invalid recipientId, expected number",
            path: "recipientId",
            location: "body",
          },
        ],
      });
    });
  });

  describe("add message receipts for conversation endpoint", () => {
    test("add message receipts for the authenticated user", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      // Aisha (account 2) marks John's message as read
      const agent = createAuthenticatedAgentAs(2);
      const res = await agent.post("/api/conversations/1/messages/receipts");

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            messageId: 1,
            userAccountId: 2,
            readAt: isoDateString(),
          },
        ],
      });
    });

    test("ignores a userAccountId in the request body", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();

      const agent = createAuthenticatedAgentAs(2);
      const res = await agent
        .post("/api/conversations/1/messages/receipts")
        .send({ userAccountId: 1 });

      expect(res.status).toBe(201);
      expect(res.type).toBe("application/json");
      expect(res.body).toEqual({
        success: true,
        data: [
          {
            id: 1,
            messageId: 1,
            userAccountId: 2,
            readAt: isoDateString(),
          },
        ],
      });
    });

    test("user unread count resets to zero", async () => {
      await populateConversation();
      await populateUserConversation();

      // John sends a message to Aisha
      const john = await createAuthenticatedAgent();
      await john
        .post("/api/conversations/1/messages")
        .send({ content: "Hello", recipientId: 2 })
        .set("Accept", "application/json")
        .expect(201);

      const aisha = createAuthenticatedAgentAs(2);
      const beforeRead = await aisha.get("/api/conversations");
      expect(listedConversation(beforeRead.body, 1)).toMatchObject({
        unreadCount: 1,
      });

      // Aisha reads the conversation
      await aisha.post("/api/conversations/1/messages/receipts").expect(201);

      const afterRead = await aisha.get("/api/conversations");
      expect(listedConversation(afterRead.body, 1)).toMatchObject({
        unreadCount: 0,
      });
      const johnView = await john.get("/api/conversations/1");
      expect(johnView.body).toEqual(helloConversationFromJohn(isoDateString()));
    });

    test("skips soft-deleted messages", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await prisma.message.update({
        where: { id: 1 },
        data: { deletedAt: new Date() },
      });

      const aisha = createAuthenticatedAgentAs(2);
      const res = await aisha.post("/api/conversations/1/messages/receipts");

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true, data: [] });
    });

    test("returns not found for a conversation the user does not belong to", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await prisma.userConversation.updateMany({
        where: { conversationId: 1 },
        data: { unreadCount: 1 },
      });

      // Jane (account 4) is not in conversation 1
      const jane = createAuthenticatedAgentAs(4);
      const res = await jane.post("/api/conversations/1/messages/receipts");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: "Conversation not found",
      });
      expect(await prisma.messageReceipt.count()).toBe(0);
    });

    test("only resets the unread count of the conversation being read", async () => {
      await populateConversation();
      await populateUserConversation();
      await populateMessage();
      await prisma.userConversation.updateMany({
        where: { userAccountId: 1 },
        data: { unreadCount: 2 },
      });

      const john = await createAuthenticatedAgent();
      await john.post("/api/conversations/1/messages/receipts").expect(201);
      const res = await john.get("/api/conversations");

      expect(listedConversation(res.body, 1)).toMatchObject({ unreadCount: 0 });
      expect(listedConversation(res.body, 2)).toMatchObject({ unreadCount: 2 });
    });
  });
});
