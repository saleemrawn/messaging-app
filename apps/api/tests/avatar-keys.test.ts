import { describe, expect, test } from "vitest";
import {
  AVATAR_FILE_NAME_PATTERN,
  isUploadKey,
  seedAvatarKey,
  uploadAvatarKey,
} from "../src/avatar/avatar-keys.ts";

const HASH = "0123456789abcdef";

describe("avatar keys", () => {
  test("seedAvatarKey puts a seed file under the avatars prefix", () => {
    expect(seedAvatarKey("seed-01.jpg")).toBe("avatars/seed-01.jpg");
  });

  test("uploadAvatarKey names the file after the account and content hash", () => {
    expect(uploadAvatarKey(12, HASH, "png")).toBe(
      `avatars/user-12-${HASH}.png`,
    );
  });

  test("isUploadKey accepts upload keys only", () => {
    expect(isUploadKey(`avatars/user-12-${HASH}.jpg`)).toBe(true);
    expect(isUploadKey(`avatars/user-12-${HASH}.png`)).toBe(true);
    expect(isUploadKey("avatars/seed-01.jpg")).toBe(false);
    expect(isUploadKey(`user-12-${HASH}.png`)).toBe(false);
    expect(isUploadKey(`avatars/user-12-${HASH}.png/../x`)).toBe(false);
  });

  test.each([
    "seed-01.jpg",
    "seed-21.jpeg",
    "seed-07.png",
    `user-1-${HASH}.jpg`,
    `user-345-${HASH}.png`,
  ])("file name pattern accepts %s", (fileName) => {
    expect(AVATAR_FILE_NAME_PATTERN.test(fileName)).toBe(true);
  });

  test.each([
    "../package.json",
    "seed-1.jpg",
    "seed-01.gif",
    `user-1-${HASH.toUpperCase()}.png`,
    "user-1-abc.png",
    ".env",
    "seed-01.jpg/",
  ])("file name pattern rejects %s", (fileName) => {
    expect(AVATAR_FILE_NAME_PATTERN.test(fileName)).toBe(false);
  });
});
