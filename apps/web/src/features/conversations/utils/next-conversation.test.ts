import { describe, expect, test } from "vitest";
import { getNextConversationId } from "./next-conversation.ts";

function list(...ids: number[]) {
  return ids.map((id) => ({ id }));
}

describe("getNextConversationId", () => {
  test("returns the conversation below the archived one", () => {
    expect(getNextConversationId(list(5, 3, 8), 3)).toBe(8);
  });

  test("returns the conversation below when archiving the first one", () => {
    expect(getNextConversationId(list(5, 3, 8), 5)).toBe(3);
  });

  test("returns the conversation above when archiving the last one", () => {
    expect(getNextConversationId(list(5, 3, 8), 8)).toBe(3);
  });

  test("returns null when archiving the only conversation", () => {
    expect(getNextConversationId(list(5), 5)).toBeNull();
  });

  test("returns null when the conversation isn't in the list", () => {
    expect(getNextConversationId(list(5, 3), 9)).toBeNull();
  });
});
