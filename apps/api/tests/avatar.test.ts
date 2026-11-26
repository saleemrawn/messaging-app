import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { prisma } from "../src/lib/prisma.ts";
import {
  populateUser,
  populateUserAccount,
  resetDbTables,
} from "./helpers/database.ts";
import {
  createAuthenticatedAgent,
  createAuthenticatedAgentAs,
  createUnauthenticatedAgent,
} from "./helpers/auth.ts";

const UPLOAD_URL_PATTERN = /^\/avatars\/user-1-[a-f0-9]{16}\.(jpg|png)$/;
const MAX_BYTES = 4 * 1024 * 1024;

let storageDir: string;
const originalStorageDir = process.env.AVATAR_STORAGE_DIR;

const avatarsDir = () => path.join(storageDir, "avatars");
const storedFiles = async () => (await readdir(avatarsDir())).sort();

type ImageFormat = "png" | "jpeg";

interface ImageOptions {
  width?: number;
  height?: number;
  color?: string;
}

function makeImage(
  format: ImageFormat,
  { width = 400, height = width, color = "#3366ff" }: ImageOptions = {},
): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .toFormat(format)
    .toBuffer();
}

function attachOptions(format: ImageFormat) {
  return format === "png"
    ? { filename: "photo.png", contentType: "image/png" }
    : { filename: "photo.jpg", contentType: "image/jpeg" };
}

async function uploadAs(
  userAccountId: number,
  image: Buffer,
  format: ImageFormat = "png",
) {
  return createAuthenticatedAgentAs(userAccountId)
    .put(`/api/users/${String(userAccountId)}/avatar`)
    .attach("avatar", image, attachOptions(format));
}

beforeAll(async () => {
  storageDir = await mkdtemp(path.join(tmpdir(), "avatar-api-"));
  process.env.AVATAR_STORAGE_DIR = storageDir;
});

afterAll(async () => {
  if (originalStorageDir === undefined) {
    delete process.env.AVATAR_STORAGE_DIR;
  } else {
    process.env.AVATAR_STORAGE_DIR = originalStorageDir;
  }
  await rm(storageDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await rm(avatarsDir(), { recursive: true, force: true });
  await mkdir(avatarsDir(), { recursive: true });
  await resetDbTables();
  await populateUser();
  await populateUserAccount();
});

describe("PUT /api/users/:id/avatar", () => {
  test.each<ImageFormat>(["png", "jpeg"])(
    "stores a %s upload at 320×320 and returns its URL",
    async (format) => {
      const res = await uploadAs(1, await makeImage(format), format);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: { id: 1, username: "johndoe01" },
      });
      const avatarUrl = (res.body as { data: { avatarUrl: string } }).data
        .avatarUrl;
      expect(avatarUrl).toMatch(UPLOAD_URL_PATTERN);
      expect(avatarUrl.endsWith(format === "png" ? ".png" : ".jpg")).toBe(true);

      const fileName = path.basename(avatarUrl);
      expect(await storedFiles()).toEqual([fileName]);
      const metadata = await sharp(
        path.join(avatarsDir(), fileName),
      ).metadata();
      expect(metadata).toMatchObject({ width: 320, height: 320, format });
    },
  );

  test("the new avatar is included in /auth/me", async () => {
    const upload = await uploadAs(1, await makeImage("png"));

    const res = await createAuthenticatedAgentAs(1).get("/api/auth/me");

    expect(res.body).toMatchObject({
      data: {
        avatarUrl: (upload.body as { data: { avatarUrl: string } }).data
          .avatarUrl,
      },
    });
  });

  test("works through the cookie login too", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent
      .put("/api/users/1/avatar")
      .attach("avatar", await makeImage("png"), attachOptions("png"));

    expect(res.statusCode).toBe(200);
  });

  test("replacing the photo stores a new file and deletes the old one", async () => {
    const first = await uploadAs(1, await makeImage("jpeg"), "jpeg");
    const second = await uploadAs(
      1,
      await makeImage("png", { color: "#ff6633" }),
    );

    const firstUrl = (first.body as { data: { avatarUrl: string } }).data
      .avatarUrl;
    const secondUrl = (second.body as { data: { avatarUrl: string } }).data
      .avatarUrl;
    expect(second.statusCode).toBe(200);
    expect(secondUrl).not.toBe(firstUrl);
    expect(await storedFiles()).toEqual([path.basename(secondUrl)]);
  });

  test("re-uploading the same image keeps a single file", async () => {
    const image = await makeImage("png");

    const first = await uploadAs(1, image);
    const second = await uploadAs(1, image);

    expect(second.statusCode).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(await storedFiles()).toHaveLength(1);
  });

  test("rejects a non-square image", async () => {
    const res = await uploadAs(
      1,
      await makeImage("png", { width: 400, height: 300 }),
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Image must be square (1:1)",
    });
    expect(await storedFiles()).toEqual([]);
  });

  test("rejects a file over 4 MB", async () => {
    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/1/avatar")
      .attach("avatar", Buffer.alloc(MAX_BYTES + 1), attachOptions("png"));

    expect(res.statusCode).toBe(413);
    expect(res.body).toEqual({
      success: false,
      message: "Image must be 4 MB or smaller",
    });
  });

  test("rejects a file that isn't a JPG or PNG", async () => {
    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/1/avatar")
      .attach("avatar", Buffer.from("hello"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Image must be a JPG or PNG file",
    });
  });

  test("rejects a GIF", async () => {
    const gif = await sharp({
      create: { width: 50, height: 50, channels: 3, background: "#000" },
    })
      .gif()
      .toBuffer();

    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/1/avatar")
      .attach("avatar", gif, { filename: "a.gif", contentType: "image/gif" });

    expect(res.statusCode).toBe(400);
  });

  test("rejects content that only claims to be a PNG", async () => {
    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/1/avatar")
      .attach("avatar", Buffer.from("<svg onload=alert(1)>"), {
        filename: "evil.png",
        contentType: "image/png",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Image must be a JPG or PNG file",
    });
    expect(await storedFiles()).toEqual([]);
  });

  test("rejects a GIF that claims to be a PNG", async () => {
    const gif = await sharp({
      create: { width: 50, height: 50, channels: 3, background: "#000" },
    })
      .gif()
      .toBuffer();

    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/1/avatar")
      .attach("avatar", gif, attachOptions("png"));

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Image must be a JPG or PNG file",
    });
  });

  test("rejects a request without a file", async () => {
    const res = await createAuthenticatedAgentAs(1).put("/api/users/1/avatar");

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Choose an image to upload",
    });
  });

  test("rejects a file sent under another field name", async () => {
    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/1/avatar")
      .attach("photo", await makeImage("png"), attachOptions("png"));

    expect(res.statusCode).toBe(400);
  });

  test("forbids changing someone else's photo", async () => {
    const res = await createAuthenticatedAgentAs(2)
      .put("/api/users/1/avatar")
      .attach("avatar", await makeImage("png"), attachOptions("png"));

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: "You can only change your own profile photo",
    });
    expect(await storedFiles()).toEqual([]);
  });

  test("rejects an invalid user id", async () => {
    const res = await createAuthenticatedAgentAs(1)
      .put("/api/users/abc/avatar")
      .attach("avatar", await makeImage("png"), attachOptions("png"));

    expect(res.statusCode).toBe(400);
  });

  test("requires authentication", async () => {
    const res = await createUnauthenticatedAgent()
      .put("/api/users/1/avatar")
      .attach("avatar", await makeImage("png"), attachOptions("png"));

    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/avatars/:fileName", () => {
  // Public by unguessable URL: no login needed, cacheable by CDNs too.
  test("serves an uploaded avatar without authentication", async () => {
    const upload = await uploadAs(1, await makeImage("png"));
    const avatarUrl = (upload.body as { data: { avatarUrl: string } }).data
      .avatarUrl;

    const res = await createUnauthenticatedAgent().get(`/api${avatarUrl}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("serves a seed avatar", async () => {
    await writeFile(
      path.join(avatarsDir(), "seed-01.jpg"),
      await makeImage("jpeg"),
    );

    const res = await createUnauthenticatedAgent().get(
      "/api/avatars/seed-01.jpg",
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
  });

  test("never sets cookies", async () => {
    await writeFile(
      path.join(avatarsDir(), "seed-01.jpg"),
      await makeImage("jpeg"),
    );

    const res = await createAuthenticatedAgentAs(1).get(
      "/api/avatars/seed-01.jpg",
    );

    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  test("returns 404 for a missing avatar", async () => {
    const res = await createAuthenticatedAgentAs(1).get(
      "/api/avatars/seed-09.jpg",
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Avatar not found" });
  });

  test.each(["notes.txt", "..%2F..%2Fpackage.json", "seed-01.gif"])(
    "rejects the file name %s",
    async (fileName) => {
      const res = await createAuthenticatedAgentAs(1).get(
        `/api/avatars/${fileName}`,
      );

      expect(res.statusCode).toBe(400);
    },
  );
});

describe("DELETE /api/users/:id/avatar", () => {
  test("removes the uploaded photo", async () => {
    await uploadAs(1, await makeImage("png"));

    const res = await createAuthenticatedAgentAs(1).delete(
      "/api/users/1/avatar",
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { id: 1, avatarUrl: null },
    });
    expect(await storedFiles()).toEqual([]);
  });

  test("keeps a seed photo file while clearing it from the user", async () => {
    await writeFile(
      path.join(avatarsDir(), "seed-02.jpg"),
      await makeImage("jpeg"),
    );
    await prisma.user.update({
      where: { id: 2 },
      data: { avatarKey: "avatars/seed-02.jpg" },
    });

    const res = await createAuthenticatedAgentAs(2).delete(
      "/api/users/2/avatar",
    );

    expect(res.body).toMatchObject({ data: { id: 2, avatarUrl: null } });
    expect(await storedFiles()).toEqual(["seed-02.jpg"]);
  });

  test("uploading over a seed photo keeps the seed file", async () => {
    await writeFile(
      path.join(avatarsDir(), "seed-01.jpg"),
      await makeImage("jpeg"),
    );
    await prisma.user.update({
      where: { id: 1 },
      data: { avatarKey: "avatars/seed-01.jpg" },
    });

    const res = await uploadAs(1, await makeImage("png"));

    expect(res.statusCode).toBe(200);
    expect(await storedFiles()).toEqual([
      "seed-01.jpg",
      path.basename(
        (res.body as { data: { avatarUrl: string } }).data.avatarUrl,
      ),
    ]);
  });

  test("succeeds when there is no photo", async () => {
    const res = await createAuthenticatedAgentAs(1).delete(
      "/api/users/1/avatar",
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ data: { avatarUrl: null } });
  });

  test("forbids removing someone else's photo", async () => {
    const res = await createAuthenticatedAgentAs(2).delete(
      "/api/users/1/avatar",
    );

    expect(res.statusCode).toBe(403);
  });

  test("requires authentication", async () => {
    const res = await createUnauthenticatedAgent().delete(
      "/api/users/1/avatar",
    );

    expect(res.statusCode).toBe(401);
  });
});
