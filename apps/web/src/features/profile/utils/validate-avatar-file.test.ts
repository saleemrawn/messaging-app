import { describe, expect, test } from "vitest";
import {
  AVATAR_MAX_BYTES,
  validateAvatarFile,
} from "./validate-avatar-file.ts";

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateAvatarFile", () => {
  test.each([
    ["photo.jpg", "image/jpeg"],
    ["photo.JPEG", "image/jpeg"],
    ["photo.png", "image/png"],
  ])("accepts %s", (name, type) => {
    expect(validateAvatarFile(makeFile(name, type))).toBeNull();
  });

  test("accepts a file with no MIME type when its extension is allowed", () => {
    expect(validateAvatarFile(makeFile("photo.jpg", ""))).toBeNull();
  });

  test.each([
    ["animation.gif", "image/gif"],
    ["vector.svg", "image/svg+xml"],
    ["photo.webp", "image/webp"],
    ["notes.txt", "text/plain"],
    ["photo.heic", ""],
  ])("rejects %s", (name, type) => {
    expect(validateAvatarFile(makeFile(name, type))).toBe(
      "Image must be a JPG or PNG file",
    );
  });

  test("accepts a file of exactly 4 MB", () => {
    expect(
      validateAvatarFile(makeFile("photo.png", "image/png", AVATAR_MAX_BYTES)),
    ).toBeNull();
  });

  test("rejects a file over 4 MB", () => {
    expect(
      validateAvatarFile(
        makeFile("photo.png", "image/png", AVATAR_MAX_BYTES + 1),
      ),
    ).toBe("Image must be 4 MB or smaller");
  });

  test("rejects an empty file", () => {
    expect(validateAvatarFile(makeFile("photo.png", "image/png", 0))).toBe(
      "That file is empty",
    );
  });
});
