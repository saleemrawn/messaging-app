import { access, readdir, rm } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import { getAvatarStorageDir } from "../src/avatar/avatar-storage.ts";
import {
  AVATAR_KEY_PREFIX,
  isUploadKey,
  seedAvatarKey,
} from "../src/avatar/avatar-keys.ts";
import {
  SEED_PASSWORD,
  buildSeed,
  seedAvatarBaseName,
  type SeedConversation,
  type SeedUser,
} from "./seed-data.ts";

// Wipes every table and fills it with dev data: USER_COUNT users with a
// conversation between every pair. Run with `npm run seed -w apps/api`.

const USER_COUNT = 21;
const FAKER_SEED = 2026;
const BCRYPT_ROUNDS = 10;
const TRANSACTION_TIMEOUT_MS = 30_000;
const SEED_AVATAR_EXTENSIONS = ["jpg", "jpeg", "png"] as const;

type Tx = Prisma.TransactionClient;

function getAvatarsDir(): string {
  return path.join(getAvatarStorageDir(), AVATAR_KEY_PREFIX);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (_err: unknown) {
    return false;
  }
}

// The key of user `index`'s seed photo, trying each accepted extension, or
// null when no file was supplied.
async function findSeedAvatarKey(index: number): Promise<string | null> {
  const baseName = seedAvatarBaseName(index);
  for (const extension of SEED_AVATAR_EXTENSIONS) {
    const fileName = `${baseName}.${extension}`;
    if (await fileExists(path.join(getAvatarsDir(), fileName))) {
      return seedAvatarKey(fileName);
    }
  }
  return null;
}

async function resolveSeedAvatarKeys(
  count: number,
): Promise<(string | null)[]> {
  const keys = await Promise.all(
    Array.from({ length: count }, (_, index) => findSeedAvatarKey(index)),
  );

  const missing = keys.flatMap((key, index) =>
    key ? [] : [seedAvatarBaseName(index)],
  );
  if (missing.length > 0) {
    console.warn(
      `No seed photo for ${missing.join(", ")} in ${getAvatarsDir()} ` +
        `(expected .${SEED_AVATAR_EXTENSIONS.join("/.")}); those users show initials.`,
    );
  }

  return keys;
}

// Account ids restart on every seed, so earlier uploads would belong to
// nobody (or, worse, look like someone else's). Seed photos are kept.
async function deleteUploadedAvatars(): Promise<void> {
  const fileNames = await readdir(getAvatarsDir()).catch(() => []);
  await Promise.all(
    fileNames
      .filter((fileName) => isUploadKey(`${AVATAR_KEY_PREFIX}${fileName}`))
      .map((fileName) => rm(path.join(getAvatarsDir(), fileName))),
  );
}

async function createAccounts(
  tx: Tx,
  users: SeedUser[],
  avatarKeys: (string | null)[],
): Promise<number[]> {
  const password = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  const accountIds: number[] = [];

  for (const [index, user] of users.entries()) {
    const { firstName, lastName, email, username } = user;
    const avatarKey = avatarKeys[index] ?? null;
    const account = await tx.userAccount.create({
      data: {
        username,
        password,
        user: { create: { firstName, lastName, email, avatarKey } },
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

function printLogins(
  users: SeedUser[],
  conversations: SeedConversation[],
  avatarKeys: (string | null)[],
) {
  const rows = users.map(({ username, firstName, lastName }, index) => ({
    username,
    name: `${firstName} ${lastName}`,
    avatar: avatarKeys[index]?.slice(AVATAR_KEY_PREFIX.length) ?? "(initials)",
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
  const avatarKeys = await resolveSeedAvatarKeys(users.length);

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        TRUNCATE TABLE "users", "user_accounts", "conversations", "user_conversations", "messages", "message_receipts", "contacts"
        RESTART IDENTITY CASCADE
      `;

      const accountIds = await createAccounts(tx, users, avatarKeys);
      for (const conversation of conversations) {
        await createConversation(tx, conversation, accountIds);
      }
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );

  await deleteUploadedAvatars();
  printLogins(users, conversations, avatarKeys);
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
