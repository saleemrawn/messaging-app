import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  createLocalAvatarStorage,
  type AvatarStorage,
} from "../src/avatar/avatar-storage.ts";

let rootDir: string;
let storage: AvatarStorage;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "avatar-storage-"));
  storage = createLocalAvatarStorage(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("local avatar storage", () => {
  test("put writes the data at the key, creating folders as needed", async () => {
    await storage.put("avatars/user-1.png", Buffer.from("image"), "image/png");

    const saved = await readFile(path.join(rootDir, "avatars/user-1.png"));
    expect(saved.toString()).toBe("image");
  });

  test("put leaves no temporary files behind", async () => {
    await storage.put("avatars/user-1.png", Buffer.from("image"), "image/png");

    expect(await readdir(path.join(rootDir, "avatars"))).toEqual([
      "user-1.png",
    ]);
  });

  test("put overwrites an existing file", async () => {
    await storage.put("avatars/user-1.png", Buffer.from("old"), "image/png");
    await storage.put("avatars/user-1.png", Buffer.from("new"), "image/png");

    const saved = await readFile(path.join(rootDir, "avatars/user-1.png"));
    expect(saved.toString()).toBe("new");
  });

  test("delete removes the file", async () => {
    await storage.put("avatars/user-1.png", Buffer.from("image"), "image/png");

    await storage.delete("avatars/user-1.png");

    expect(await readdir(path.join(rootDir, "avatars"))).toEqual([]);
  });

  test("delete ignores a missing file", async () => {
    await expect(
      storage.delete("avatars/missing.png"),
    ).resolves.toBeUndefined();
  });

  test("getUrl returns the key as a path relative to the API base", async () => {
    await expect(storage.getUrl("avatars/seed-01.jpg")).resolves.toBe(
      "/avatars/seed-01.jpg",
    );
  });

  test("rejects keys that escape the storage folder", async () => {
    await expect(
      storage.put("../outside.png", Buffer.from("x"), "image/png"),
    ).rejects.toThrow(/invalid avatar key/i);
    await expect(storage.delete("avatars/../../outside.png")).rejects.toThrow(
      /invalid avatar key/i,
    );
  });
});
