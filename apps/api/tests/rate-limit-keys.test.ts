import { describe, test, expect } from "vitest";
import { toIpKey, toUsernameKey } from "../src/rate-limit/rate-limit-keys.ts";

describe("toIpKey", () => {
  test("returns an IPv4 address unchanged", () => {
    expect(toIpKey("203.0.113.7")).toBe("203.0.113.7");
  });

  test("unwraps an IPv4-mapped IPv6 address to IPv4", () => {
    expect(toIpKey("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  test("groups IPv6 addresses in the same /64 under one key", () => {
    expect(toIpKey("2001:db8:1:2:aaaa::1")).toBe(
      toIpKey("2001:db8:1:2:ffff:ffff:ffff:ffff"),
    );
  });

  test("gives IPv6 addresses in different /64s different keys", () => {
    expect(toIpKey("2001:db8:1:2::1")).not.toBe(toIpKey("2001:db8:1:3::1"));
  });

  test("returns the /64 prefix for an IPv6 address", () => {
    expect(toIpKey("2001:db8:1:2:aaaa::1")).toBe("2001:db8:1:2::/64");
  });

  test("handles the IPv6 loopback address", () => {
    expect(toIpKey("::1")).toBe("0:0:0:0::/64");
  });

  test("returns a fixed key when the address is missing or invalid", () => {
    expect(toIpKey(undefined)).toBe("unknown");
    expect(toIpKey("not-an-ip")).toBe("unknown");
  });
});

describe("toUsernameKey", () => {
  test("trims and lowercases the username", () => {
    expect(toUsernameKey("  JohnDoe01 ")).toBe("johndoe01");
  });
});
