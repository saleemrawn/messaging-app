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

async function populateDb() {
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

export { populateDb, resetDbTables };
