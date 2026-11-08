import { prisma } from "../../src/lib/prisma.ts";

async function resetDbTables() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset tables in production");
  }

  await prisma.$executeRaw`
        TRUNCATE TABLE "users", "user_accounts", "conversations", "user_conversations", "messages", "message_receipts"
        RESTART IDENTITY CASCADE
      `;
}

async function populateUser() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  await prisma.user.createMany({
    data: [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe01@email.com",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
      {
        firstName: "Aisha",
        lastName: "Doe",
        email: "aisha.doe01@email.com",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
      {
        firstName: "Phillipe",
        lastName: "Doe",
        email: "phillipe.doe01@email.com",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
      {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe01@email.com",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
    ],
  });
}

async function populateUserAccount() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  await prisma.userAccount.createMany({
    data: [
      {
        userId: 1,
        username: "johndoe01",
        password: "Monkey123!",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
      {
        userId: 2,
        username: "aishadoe01",
        password: "Monkey123!",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
      {
        userId: 3,
        username: "phillipedoe01",
        password: "Monkey123!",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
      {
        userId: 4,
        username: "janedoe01",
        password: "Monkey123!",
        createdAt: new Date("2026-01-01T20:00:00"),
        updatedAt: new Date("2026-01-01T20:00:00"),
      },
    ],
  });
}

async function populateUserConversation() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  await prisma.userConversation.createMany({
    data: [
      { userAccountId: 1, conversationId: 1 },
      { userAccountId: 2, conversationId: 1 },
      { userAccountId: 1, conversationId: 2 },
      { userAccountId: 3, conversationId: 2 },
    ],
  });
}

async function populateConversation() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  await prisma.conversation.createMany({
    data: [
      { updatedAt: new Date("2026-01-01T20:10:00") },
      { updatedAt: new Date("2026-01-01T21:10:00") },
    ],
  });
}

async function populateMessage() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  await prisma.message.createMany({
    data: [
      {
        content: "Lorem ipsum dolor sit amet",
        userAccountId: 1,
        conversationId: 1,
        createdAt: new Date("2026-01-01T20:00:00"),
      },
      {
        content: "Consectetur adipiscing elit",
        userAccountId: 2,
        conversationId: 1,
        createdAt: new Date("2026-01-01T20:10:00"),
      },
      {
        content: "Sed do eiusmod tempor incididunt",
        userAccountId: 1,
        conversationId: 2,
        createdAt: new Date("2026-01-01T21:00:00"),
      },
      {
        content: "Labore et dolore magna aliqua",
        userAccountId: 3,
        conversationId: 2,
        createdAt: new Date("2026-01-01T21:10:00"),
      },
    ],
  });
}

export {
  populateUser,
  populateUserAccount,
  populateConversation,
  populateMessage,
  populateUserConversation,
  resetDbTables,
};
