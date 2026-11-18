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

// Conversation 1 after John (account 1) sends "Hello" to Aisha (account 2)
const helloConversationFromJohn = (recipientUnreadCount: number) => ({
  success: true,
  data: {
    id: 1,
    updatedAt: isoDateString(),
    messages: [
      {
        id: 1,
        content: "Hello",
        createdAt: isoDateString(),
        userAccount: {
          id: 1,
          deletedAt: null,
          user: { id: 1, firstName: "John", lastName: "Doe" },
        },
      },
    ],
    userConversations: [
      { id: 1, userAccountId: 1, unreadCount: 0 },
      { id: 2, userAccountId: 2, unreadCount: recipientUnreadCount },
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
      userConversations: [
        {
          userAccount: {
            id: 1,
            deletedAt: null,
            user: { firstName: "John", lastName: "Doe" },
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
};

describe("conversation route", () => {
  describe("authentication", () => {
    const routes: ["get" | "post" | "delete", string][] = [
      ["get", "/api/conversations"],
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
  });

  describe("get conversation by ID route", () => {
    test("returns a conversation by ID", async () => {
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
          userConversations: [
            { id: 1, userAccountId: 1, unreadCount: 0 },
            { id: 2, userAccountId: 2, unreadCount: 0 },
          ],
        },
      });
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
      expect(res.body).toEqual({
        success: true,
        data: {
          id: 1,
          messages: [
            {
              id: 1,
              content: "Hello, how is it going?",
              createdAt: isoDateString(),
            },
          ],
          userConversations: [
            { id: 1, unreadCount: 0 },
            { id: 2, unreadCount: 1 },
          ],
        },
      });
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
          messages: [
            {
              id: 1,
              content: "Hello, how is it going?",
              createdAt: isoDateString(),
              userAccount: {
                id: 1,
                deletedAt: null,
                user: { id: 1, firstName: "John", lastName: "Doe" },
              },
            },
          ],
          userConversations: [
            { id: 1, userAccountId: 1, unreadCount: 0 },
            { id: 2, userAccountId: 2, unreadCount: 1 },
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
      expect(res.body).toEqual(helloConversationFromJohn(1));
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

      const john = await createAuthenticatedAgent();

      // John sends a message to Aisha
      await john
        .post("/api/conversations/1/messages")
        .send({ content: "Hello", recipientId: 2 })
        .set("Accept", "application/json")
        .expect(201);

      const beforeRead = await john.get("/api/conversations/1");
      expect(beforeRead.body).toEqual(helloConversationFromJohn(1));

      // Aisha reads the conversation
      const aisha = createAuthenticatedAgentAs(2);
      await aisha.post("/api/conversations/1/messages/receipts").expect(201);

      const afterRead = await john.get("/api/conversations/1");
      expect(afterRead.body).toEqual(helloConversationFromJohn(0));
    });
  });
});
