import { prisma } from "../src/lib/prisma.ts";
import { faker } from "@faker-js/faker";

const USER_COUNT = 4;

function createRandomUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: faker.internet.password(),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }
  if (USER_COUNT % 2 !== 0) {
    throw new Error(
      `USER_COUNT must be even, received ${USER_COUNT.toString()}`,
    );
  }

  const userData = faker.helpers
    .multiple(createRandomUser, { count: USER_COUNT })
    .map(({ firstName, lastName }) => ({
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }),
    }));

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        TRUNCATE TABLE "users", "user_accounts", "conversations", "user_conversations", "messages", "message_receipts"
        RESTART IDENTITY CASCADE
      `;

      const users = await tx.user.createManyAndReturn({ data: userData });

      const userAccounts = await tx.userAccount.createManyAndReturn({
        data: users.map((user) => ({
          userId: user.id,
          username: faker.internet.username({
            firstName: user.firstName,
            lastName: user.lastName,
          }),
          password: faker.internet.password(),
        })),
      });

      const conversations = await tx.conversation.createManyAndReturn({
        data: Array.from({ length: users.length / 2 }, () => ({})),
      });

      await tx.userConversation.createMany({
        data: userAccounts.map((account, i) => ({
          userAccountId: account.id,
          conversationId: conversations[Math.floor(i / 2)].id,
        })),
      });

      const messages = await tx.message.createManyAndReturn({
        data: userAccounts.map((account, i) => ({
          content: faker.lorem.sentence(),
          userAccountId: account.id,
          conversationId: conversations[Math.floor(i / 2)].id,
        })),
      });

      await tx.messageReceipt.createMany({
        data: userAccounts.map((account, i) => ({
          userAccountId: account.id,
          messageId: messages[i].id,
          readAt: new Date(),
        })),
      });
    },
    { timeout: 30_000 },
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
