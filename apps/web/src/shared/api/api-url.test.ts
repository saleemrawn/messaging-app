import { describe, expect, test } from "vitest";
import { toApiUrl } from "./api-url.ts";
import { API_URL } from "../../test/server.ts";

describe("toApiUrl", () => {
  test("resolves a path against the API base URL", () => {
    expect(toApiUrl("/avatars/seed-01.jpg")).toBe(
      `${API_URL}/avatars/seed-01.jpg`,
    );
  });

  test("passes an absolute URL through unchanged", () => {
    const cdnUrl = "https://cdn.example.com/avatars/seed-01.jpg";

    expect(toApiUrl(cdnUrl)).toBe(cdnUrl);
  });

  test("passes a protocol-relative URL through unchanged", () => {
    expect(toApiUrl("//cdn.example.com/a.png")).toBe("//cdn.example.com/a.png");
  });
});
