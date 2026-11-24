import { describe, expect, test } from "vitest";
import {
  MAX_MESSAGES_PER_CONVERSATION,
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

  test("the today anchor stays on today just after midnight", () => {
    const justAfterMidnight = new Date(2026, 5, 15, 0, 1);
    for (let run = 0; run < RUNS; run++) {
      const todayAnchor = buildAnchors(6, justAfterMidnight).at(0);

      expect(todayAnchor?.getTime()).toBeGreaterThanOrEqual(
        startOfDay(justAfterMidnight).getTime(),
      );
    }
  });

  test("buildSeed gives four users a conversation with every other user", () => {
    const { users, conversations } = buildSeed(4, NOW);

    expect(users).toHaveLength(4);
    expect(conversations).toHaveLength(6);
    for (const userIndex of [0, 1, 2, 3]) {
      const own = conversations.filter(({ pair }) => pair.includes(userIndex));
      expect(own).toHaveLength(3);
    }
  });

  test("buildSeed refuses more conversations than there are anchor slots", () => {
    expect(() => buildSeed(5, NOW)).toThrow(/at most/i);
  });
});
