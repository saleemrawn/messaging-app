import { faker } from "@faker-js/faker";

// Pure, side-effect-free builders for the dev seed in populate.ts.
// Users are referred to by their index in the built users array.

const SEED_PASSWORD = "Testpassword01!";
const MAX_MESSAGES_PER_CONVERSATION = 5;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MIN_GAP_MINUTES = 2;
const MAX_GAP_MINUTES = 90;
const MAX_TODAY_OFFSET_MINUTES = 180;
// Older anchors land during the day, between 08:00 and 22:00.
const DAYTIME_START_MINUTES = 8 * 60;
const DAYTIME_END_MINUTES = 22 * 60;
const LONG_MESSAGE_CHANCE = 0.2;

// Days before today for each conversation's latest message, newest first, so
// the list shows "10:00 AM", "Yesterday" and "Mon 12th Jun" style timestamps.
const ANCHOR_DAYS_AGO = [0, 1, 3, 9, 30, 75] as const;

type Pair = readonly [number, number];

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

interface SeedMessage {
  senderIndex: number;
  content: string;
  createdAt: Date;
  // When the other participant read it; null while unread.
  readAt: Date | null;
}

interface SeedConversation {
  pair: Pair;
  messages: SeedMessage[];
  // Keyed by user index.
  unreadCounts: Record<number, number>;
}

interface Seed {
  users: SeedUser[];
  conversations: SeedConversation[];
}

function buildUsers(count: number): SeedUser[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = `${firstName}${lastName}${String(i + 1)}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return { firstName, lastName, username, email: `${username}@example.com` };
  });
}

function buildPairs(count: number): Pair[] {
  const pairs: Pair[] = [];
  for (let a = 0; a < count; a++) {
    for (let b = a + 1; b < count; b++) {
      pairs.push([a, b]);
    }
  }
  return pairs;
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildAnchor(daysAgo: number, now: Date): Date {
  const today = startOfDay(now);

  if (daysAgo === 0) {
    const minutesSinceMidnight = Math.floor(
      (now.getTime() - today.getTime()) / MINUTE_MS,
    );
    const offset = faker.number.int({
      min: 0,
      max: Math.min(MAX_TODAY_OFFSET_MINUTES, minutesSinceMidnight),
    });
    return new Date(now.getTime() - offset * MINUTE_MS);
  }

  const minuteOfDay = faker.number.int({
    min: DAYTIME_START_MINUTES,
    max: DAYTIME_END_MINUTES,
  });
  return new Date(
    today.getTime() - daysAgo * DAY_MS + minuteOfDay * MINUTE_MS,
  );
}

// One latest-message time per conversation, newest first.
function buildAnchors(count: number, now: Date): Date[] {
  return ANCHOR_DAYS_AGO.slice(0, count).map((daysAgo) =>
    buildAnchor(daysAgo, now),
  );
}

function buildMessageContent(): string {
  return faker.datatype.boolean(LONG_MESSAGE_CHANCE)
    ? faker.lorem.sentences(3)
    : faker.lorem.sentence();
}

// Message times, oldest first, ending exactly at lastMessageAt.
function buildMessageTimes(count: number, lastMessageAt: Date): Date[] {
  const times = [lastMessageAt];
  for (let i = 1; i < count; i++) {
    const gap = faker.number.int({ min: MIN_GAP_MINUTES, max: MAX_GAP_MINUTES });
    const next = times[0] ?? lastMessageAt;
    times.unshift(new Date(next.getTime() - gap * MINUTE_MS));
  }
  return times;
}

function readTimeFor(createdAt: Date, now: Date): Date {
  return new Date(Math.min(createdAt.getTime() + MINUTE_MS, now.getTime()));
}

// Mirrors the API: replying implies having read everything before. Only the
// last sender's trailing run can be unread, and the partner may have read it.
function buildConversation(
  pair: Pair,
  lastMessageAt: Date,
  now: Date,
): SeedConversation {
  const count = faker.number.int({
    min: 1,
    max: MAX_MESSAGES_PER_CONVERSATION,
  });
  const times = buildMessageTimes(count, lastMessageAt);
  const senders = times.map(() => faker.helpers.arrayElement(pair));
  const lastSender = senders.at(-1) ?? pair[0];
  const partner = lastSender === pair[0] ? pair[1] : pair[0];
  const hasPartnerReadTail = faker.datatype.boolean();

  const firstUnreadIndex = senders.findLastIndex((s) => s !== lastSender) + 1;
  const messages = times.map((createdAt, i) => ({
    senderIndex: senders[i] ?? lastSender,
    content: buildMessageContent(),
    createdAt,
    readAt:
      hasPartnerReadTail || i < firstUnreadIndex
        ? readTimeFor(createdAt, now)
        : null,
  }));
  const unreadCount = hasPartnerReadTail ? 0 : count - firstUnreadIndex;

  return {
    pair,
    messages,
    unreadCounts: { [lastSender]: 0, [partner]: unreadCount },
  };
}

function buildSeed(userCount: number, now: Date): Seed {
  const pairs = faker.helpers.shuffle(buildPairs(userCount));
  if (pairs.length > ANCHOR_DAYS_AGO.length) {
    throw new Error(
      `Can seed at most ${String(ANCHOR_DAYS_AGO.length)} conversations, ${String(userCount)} users need ${String(pairs.length)}`,
    );
  }

  const anchors = buildAnchors(pairs.length, now);
  return {
    users: buildUsers(userCount),
    conversations: pairs.map((pair, i) =>
      buildConversation(pair, anchors[i] ?? now, now),
    ),
  };
}

export {
  SEED_PASSWORD,
  MAX_MESSAGES_PER_CONVERSATION,
  buildUsers,
  buildPairs,
  buildAnchors,
  buildConversation,
  buildSeed,
};
export type { Pair, Seed, SeedUser, SeedMessage, SeedConversation };
