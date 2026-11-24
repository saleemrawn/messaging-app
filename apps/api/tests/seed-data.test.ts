import { describe, expect, test } from "vitest";
import {
  MAX_MESSAGES_PER_CONVERSATION,
  UNREAD_PER_USER,
  buildAnchors,
  buildConversation,
  buildPairs,
  buildSeed,
  buildUsers,
  type SeedConversation,
} from "../prisma/seed-data.ts";

// Randomised builders: repeat each property check to cover many shapes.
const RUNS = 50;
const NOW = new Date(2026, 5, 15, 14, 30);
const MINUTE_MS = 60_000;

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function trailingRunLength({ messages }: SeedConversation): number {
  const last = messages.at(-1);
  let count = 0;
  for (const message of [...messages].reverse()) {
    if (message.senderIndex !== last?.senderIndex) break;
    count += 1;
  }
  return count;
}

describe("seed data builders", () => {
  test("buildUsers creates unique usernames and emails", () => {
    const users = buildUsers(4);

    expect(users).toHaveLength(4);
    expect(new Set(users.map((u) => u.username)).size).toBe(4);
    expect(new Set(users.map((u) => u.email)).size).toBe(4);
    for (const user of users) {
      expect(user.username).toMatch(/^[a-z0-9]+$/);
    }
  });

  test("buildPairs returns every unordered pair once", () => {
    expect(buildPairs(4)).toEqual([
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ]);
  });

  test("conversations have 1 to 5 messages from the pair, oldest first, ending at the anchor", () => {
    for (let run = 0; run < RUNS; run++) {
      const anchor = new Date(NOW.getTime() - 2 * 60 * MINUTE_MS);
      const conversation = buildConversation([1, 3], anchor, NOW);
      const { messages } = conversation;

      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages.length).toBeLessThanOrEqual(MAX_MESSAGES_PER_CONVERSATION);
      expect(messages.at(-1)?.createdAt).toEqual(anchor);
      for (const [i, message] of messages.entries()) {
        expect([1, 3]).toContain(message.senderIndex);
        expect(message.content.length).toBeGreaterThan(0);
        if (i > 0) {
          expect(message.createdAt.getTime()).toBeGreaterThan(
            messages[i - 1]?.createdAt.getTime() ?? Infinity,
          );
        }
      }
    }
  });

  test("unread counts match the messages the recipient hasn't read", () => {
    for (let run = 0; run < RUNS; run++) {
      const conversation = buildConversation([0, 2], NOW, NOW);
      const { messages, unreadCounts, pair } = conversation;
      const lastSender = messages.at(-1)?.senderIndex;
      const partner = pair.find((index) => index !== lastSender);
      const unreadMessages = messages.filter((m) => m.readAt === null);

      expect(unreadCounts[lastSender ?? -1]).toBe(0);
      expect([0, trailingRunLength(conversation)]).toContain(
        unreadCounts[partner ?? -1],
      );
      expect(unreadMessages).toHaveLength(unreadCounts[partner ?? -1] ?? -1);
      for (const message of unreadMessages) {
        expect(message.senderIndex).toBe(lastSender);
      }
    }
  });

  test("read receipts are never in the future and follow the message", () => {
    for (let run = 0; run < RUNS; run++) {
      for (const message of buildConversation([0, 1], NOW, NOW).messages) {
        if (message.readAt === null) continue;
        expect(message.readAt.getTime()).toBeGreaterThanOrEqual(
          message.createdAt.getTime(),
        );
        expect(message.readAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
    }
  });

  test("anchors are distinct and cover today, yesterday and older dates", () => {
    for (let run = 0; run < RUNS; run++) {
      const anchors = buildAnchors(6, NOW);
      const today = startOfDay(NOW).getTime();
      const yesterday = today - 24 * 60 * MINUTE_MS;

      expect(new Set(anchors.map((a) => a.getTime())).size).toBe(6);
      expect(anchors.every((a) => a.getTime() <= NOW.getTime())).toBe(true);
      expect(anchors.some((a) => a.getTime() >= today)).toBe(true);
      expect(
        anchors.some((a) => a.getTime() >= yesterday && a.getTime() < today),
      ).toBe(true);
      expect(anchors.some((a) => a.getTime() < yesterday)).toBe(true);
    }
  });

  test("anchors put 3 conversations today and 2 yesterday", () => {
    for (let run = 0; run < RUNS; run++) {
      const anchors = buildAnchors(10, NOW);
      const today = startOfDay(NOW).getTime();
      const yesterday = today - 24 * 60 * MINUTE_MS;

      expect(anchors.filter((a) => a.getTime() >= today)).toHaveLength(3);
      expect(
        anchors.filter((a) => a.getTime() >= yesterday && a.getTime() < today),
      ).toHaveLength(2);
      expect(new Set(anchors.map((a) => a.getTime())).size).toBe(10);
    }
  });

  test("the today anchor stays on today just after midnight", () => {
    const justAfterMidnight = new Date(2026, 5, 15, 0, 1);
    for (let run = 0; run < RUNS; run++) {
      const todayAnchor = buildAnchors(6, justAfterMidnight).at(0);

      expect(todayAnchor?.getTime()).toBeGreaterThanOrEqual(
        startOfDay(justAfterMidnight).getTime(),
      );
    }
  });

  test("buildSeed gives 21 users 20 conversations each, 5 of them unread", () => {
    const { users, conversations } = buildSeed(21, NOW);

    expect(users).toHaveLength(21);
    expect(conversations).toHaveLength(210);
    const times = conversations.map((c) => c.messages.at(-1)?.createdAt.getTime());
    expect(new Set(times).size).toBe(210);
    for (const userIndex of users.keys()) {
      const own = conversations.filter(({ pair }) => pair.includes(userIndex));
      const unread = own.filter((c) => (c.unreadCounts[userIndex] ?? 0) > 0);
      expect(own).toHaveLength(20);
      expect(unread).toHaveLength(UNREAD_PER_USER);
    }
  });

  test("buildSeed needs enough users to leave some conversations read", () => {
    expect(() => buildSeed(4, NOW)).toThrow(/more than/i);
  });

  test("buildConversation forces unread or read tails when asked", () => {
    for (let run = 0; run < RUNS; run++) {
      const unread = buildConversation([0, 1], NOW, NOW, 1);
      expect(unread.unreadCounts[1]).toBeGreaterThanOrEqual(1);
      expect(unread.unreadCounts[0]).toBe(0);
      expect(unread.messages.at(-1)?.senderIndex).toBe(0);

      const read = buildConversation([0, 1], NOW, NOW, null);
      expect(read.unreadCounts[0]).toBe(0);
      expect(read.unreadCounts[1]).toBe(0);
    }
  });
});
