import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import {
  SEED_PASSWORD,
  buildSeed,
  type SeedConversation,
  type SeedUser,
} from "./seed-data.ts";

// Wipes every table and fills it with dev data: USER_COUNT users with a
// conversation between every pair. Run with `npm run seed -w apps/api`.

const USER_COUNT = 4;
const FAKER_SEED = 2026;
const BCRYPT_ROUNDS = 10;
const TRANSACTION_TIMEOUT_MS = 30_000;

type Tx = Prisma.TransactionClient;

async function createAccounts(tx: Tx, users: SeedUser[]): Promise<number[]> {
  const password = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  const accountIds: number[] = [];

  for (const { firstName, lastName, email, username } of users) {
    const account = await tx.userAccount.create({
      data: {
        username,
        password,
        user: { create: { firstName, lastName, email } },
      },
      select: { id: true },
    });
    accountIds.push(account.id);
  }

  return accountIds;
}

function accountIdFor(accountIds: number[], userIndex: number): number {
  const id = accountIds.at(userIndex);
  if (id === undefined) {
    throw new Error(`No account for user index ${String(userIndex)}`);
  }
  return id;
}

async function createConversation(
  tx: Tx,
  { pair, messages, unreadCounts }: SeedConversation,
  accountIds: number[],
): Promise<void> {
  const createdAt = messages[0]?.createdAt ?? new Date();
  const updatedAt = messages.at(-1)?.createdAt ?? createdAt;

  const conversation = await tx.conversation.create({
    data: {
      createdAt,
      updatedAt,
      userConversations: {
        create: pair.map((userIndex) => ({
          userAccountId: accountIdFor(accountIds, userIndex),
          unreadCount: unreadCounts[userIndex] ?? 0,
          createdAt,
          updatedAt,
        })),
      },
    },
    select: { id: true },
  });

  for (const message of messages) {
    const recipientIndex = pair.find((i) => i !== message.senderIndex);
    await tx.message.create({
      data: {
        content: message.content,
        conversationId: conversation.id,
        userAccountId: accountIdFor(accountIds, message.senderIndex),
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
        ...(message.readAt && recipientIndex !== undefined
          ? {
              messageReceipts: {
                create: {
                  userAccountId: accountIdFor(accountIds, recipientIndex),
                  readAt: message.readAt,
                },
              },
            }
          : {}),
      },
    });
  }
}

function printLogins(users: SeedUser[], conversations: SeedConversation[]) {
  const rows = users.map(({ username, firstName, lastName }, index) => ({
    username,
    name: `${firstName} ${lastName}`,
    unread: conversations.reduce(
      (total, { unreadCounts }) => total + (unreadCounts[index] ?? 0),
      0,
    ),
  }));

  console.info(
    `Seeded ${String(users.length)} users and ${String(conversations.length)} conversations.`,
  );
  console.table(rows);
  console.info(`Password for every user: ${SEED_PASSWORD}`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed in production");
  }

  faker.seed(FAKER_SEED);
  const { users, conversations } = buildSeed(USER_COUNT, new Date());

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        TRUNCATE TABLE "users", "user_accounts", "conversations", "user_conversations", "messages", "message_receipts"
        RESTART IDENTITY CASCADE
      `;

      const accountIds = await createAccounts(tx, users);
      for (const conversation of conversations) {
        await createConversation(tx, conversation, accountIds);
      }
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );

  printLogins(users, conversations);
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
