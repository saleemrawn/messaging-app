import { describe, expect, test } from "vitest";
import { formatConversationTimestamp } from "./format-conversation-timestamp.ts";

// Monday 15th June 2026, 14:30 local time
const NOW = new Date(2026, 5, 15, 14, 30);

function iso(...parts: [number, number, number, number, number]): string {
  return new Date(...parts).toISOString();
}

describe("formatConversationTimestamp", () => {
  test("shows the time for a timestamp earlier today", () => {
    expect(formatConversationTimestamp(iso(2026, 5, 15, 10, 0), NOW)).toBe(
      "10:00 AM",
    );
  });

  test("shows an afternoon time with PM", () => {
    expect(formatConversationTimestamp(iso(2026, 5, 15, 13, 5), NOW)).toBe(
      "1:05 PM",
    );
  });

  test("shows the time for a timestamp just after midnight today", () => {
    expect(formatConversationTimestamp(iso(2026, 5, 15, 0, 0), NOW)).toBe(
      "12:00 AM",
    );
  });

  test("shows Yesterday for any time on the previous day", () => {
    expect(formatConversationTimestamp(iso(2026, 5, 14, 23, 59), NOW)).toBe(
      "Yesterday",
    );
    expect(formatConversationTimestamp(iso(2026, 5, 14, 0, 0), NOW)).toBe(
      "Yesterday",
    );
  });

  test("shows Yesterday across a year boundary", () => {
    const newYearsDay = new Date(2027, 0, 1, 9, 0);
    expect(
      formatConversationTimestamp(iso(2026, 11, 31, 22, 0), newYearsDay),
    ).toBe("Yesterday");
  });

  test("shows weekday, ordinal day and month for older timestamps", () => {
    expect(formatConversationTimestamp(iso(2026, 5, 13, 23, 59), NOW)).toBe(
      "Sat 13th Jun",
    );
    expect(formatConversationTimestamp(iso(2026, 5, 8, 9, 0), NOW)).toBe(
      "Mon 8th Jun",
    );
    expect(formatConversationTimestamp(iso(2026, 4, 1, 9, 0), NOW)).toBe(
      "Fri 1st May",
    );
    expect(formatConversationTimestamp(iso(2026, 4, 22, 9, 0), NOW)).toBe(
      "Fri 22nd May",
    );
  });
});
