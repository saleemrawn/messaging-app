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

// Each user is the unread recipient in this many conversations (needs
// 2 * UNREAD_PER_USER < user count so the rest are fully read).
const UNREAD_PER_USER = 5;

const TODAY_CONVERSATIONS = 3;
const YESTERDAY_CONVERSATIONS = 2;
const MAX_ANCHOR_ATTEMPTS = 20;

// Days before today for the nth newest conversation's latest message: the
// first few are today, the next few yesterday, then one per day, so the list
// shows "10:00 AM", "Yesterday" and "Mon 12th Jun" style timestamps.
function anchorDaysAgo(index: number): number {
  if (index < TODAY_CONVERSATIONS) return 0;
  if (index < TODAY_CONVERSATIONS + YESTERDAY_CONVERSATIONS) return 1;
  return index - TODAY_CONVERSATIONS - YESTERDAY_CONVERSATIONS + 2;
}

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
  const used = new Set<number>();

  return Array.from({ length: count }, (_, i) => {
    let anchor = buildAnchor(anchorDaysAgo(i), now);
    // Several anchors share a day, so retry until each time is unique.
    for (
      let attempt = 0;
      used.has(anchor.getTime()) && attempt < MAX_ANCHOR_ATTEMPTS;
      attempt++
    ) {
      anchor = buildAnchor(anchorDaysAgo(i), now);
    }
    used.add(anchor.getTime());
    return anchor;
  });
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
// unreadFor forces that user to have an unread tail; null forces everything
// read; undefined leaves it random.
function buildConversation(
  pair: Pair,
  lastMessageAt: Date,
  now: Date,
  unreadFor?: number | null,
): SeedConversation {
  const count = faker.number.int({
    min: 1,
    max: MAX_MESSAGES_PER_CONVERSATION,
  });
  const times = buildMessageTimes(count, lastMessageAt);
  const senders = times.map(() => faker.helpers.arrayElement(pair));
  if (typeof unreadFor === "number") {
    senders[senders.length - 1] = unreadFor === pair[0] ? pair[1] : pair[0];
  }
  const lastSender = senders.at(-1) ?? pair[0];
  const partner = lastSender === pair[0] ? pair[1] : pair[0];
  const hasPartnerReadTail =
    unreadFor === null || (unreadFor === undefined && faker.datatype.boolean());

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

// Who has an unread tail in a pair, or null for none. Users sit on a circle
// and each is the unread recipient for the UNREAD_PER_USER users just before
// them, so everyone ends up with exactly UNREAD_PER_USER unread conversations.
function pickUnreadRecipient([a, b]: Pair, userCount: number): number | null {
  const forward = b - a;
  if (forward <= UNREAD_PER_USER) return b;
  if (userCount - forward <= UNREAD_PER_USER) return a;
  return null;
}

function buildSeed(userCount: number, now: Date): Seed {
  if (userCount <= 2 * UNREAD_PER_USER) {
    throw new Error(
      `Need more than ${String(2 * UNREAD_PER_USER)} users, received ${String(userCount)}`,
    );
  }

  const pairs = faker.helpers.shuffle(buildPairs(userCount));
  const anchors = buildAnchors(pairs.length, now);

  return {
    users: buildUsers(userCount),
    conversations: pairs.map((pair, i) =>
      buildConversation(
        pair,
        anchors[i] ?? now,
        now,
        pickUnreadRecipient(pair, userCount),
      ),
    ),
  };
}

// Seed photos are supplied as files named seed-01.jpg, seed-02.png, … in the
// avatars folder; user index 0 gets seed-01.
function seedAvatarBaseName(userIndex: number): string {
  return `seed-${String(userIndex + 1).padStart(2, "0")}`;
}

export {
  SEED_PASSWORD,
  UNREAD_PER_USER,
  MAX_MESSAGES_PER_CONVERSATION,
  buildUsers,
  buildPairs,
  buildAnchors,
  buildConversation,
  buildSeed,
  seedAvatarBaseName,
};
export type { Pair, Seed, SeedUser, SeedMessage, SeedConversation };
