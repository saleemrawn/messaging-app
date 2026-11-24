import { describe, expect, test } from "vitest";
import { formatMessageTimestamp } from "./format-message-timestamp.ts";

// Monday 15th June 2026, 14:30 local time
const NOW = new Date(2026, 5, 15, 14, 30);

function iso(...parts: [number, number, number, number, number]): string {
  return new Date(...parts).toISOString();
}

describe("formatMessageTimestamp", () => {
  test("shows only the time for a message sent today", () => {
    expect(formatMessageTimestamp(iso(2026, 5, 15, 10, 0), NOW)).toBe(
      "10:00 AM",
    );
    expect(formatMessageTimestamp(iso(2026, 5, 15, 13, 5), NOW)).toBe(
      "1:05 PM",
    );
  });

  test("shows Yesterday with the time for a message sent the previous day", () => {
    expect(formatMessageTimestamp(iso(2026, 5, 14, 23, 59), NOW)).toBe(
      "Yesterday, 11:59 PM",
    );
  });

  test("shows the date and time for older messages", () => {
    expect(formatMessageTimestamp(iso(2026, 5, 13, 9, 0), NOW)).toBe(
      "Sat 13th Jun, 9:00 AM",
    );
    expect(formatMessageTimestamp(iso(2026, 4, 1, 18, 45), NOW)).toBe(
      "Fri 1st May, 6:45 PM",
    );
  });
});
