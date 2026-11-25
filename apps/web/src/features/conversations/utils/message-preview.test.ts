import { describe, expect, test } from "vitest";
import type { ConversationSummary } from "../types.ts";
import { getMessagePreview } from "./message-preview.ts";

const CURRENT_USER_ID = 1;

function buildConversation(
  latestMessage: ConversationSummary["latestMessage"],
): ConversationSummary {
  return {
    id: 1,
    updatedAt: "2026-01-01T20:10:00.000Z",
    unreadCount: 0,
    recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
    latestMessage,
  };
}

describe("getMessagePreview", () => {
  test("prefixes the caller's own message with You", () => {
    const conversation = buildConversation({
      id: 1,
      content: "See you soon",
      createdAt: "2026-01-01T20:10:00.000Z",
      senderId: CURRENT_USER_ID,
    });

    expect(getMessagePreview(conversation, CURRENT_USER_ID)).toBe(
      "You: See you soon",
    );
  });

  test("prefixes the other participant's message with their first name", () => {
    const conversation = buildConversation({
      id: 2,
      content: "On my way",
      createdAt: "2026-01-01T20:10:00.000Z",
      senderId: 2,
    });

    expect(getMessagePreview(conversation, CURRENT_USER_ID)).toBe(
      "Aisha: On my way",
    );
  });

  test("says there are no messages for an empty conversation", () => {
    expect(getMessagePreview(buildConversation(null), CURRENT_USER_ID)).toBe(
      "No messages yet",
    );
  });
});
