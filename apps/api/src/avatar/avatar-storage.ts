import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Where avatar files live. Only the local-disk adapter exists today; moving to
// a CDN or object store (S3, R2) means adding another implementation and
// choosing it in getAvatarStorage(). Callers only ever see keys and URLs.
interface AvatarStorage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  // Ignores a missing file.
  delete(key: string): Promise<void>;
  // Async so a future adapter can return signed, expiring URLs.
  getUrl(key: string): Promise<string>;
}

const DEFAULT_STORAGE_DIR = path.resolve(import.meta.dirname, "../../assets");

// Read on every call so tests can point it at a temp folder.
function getAvatarStorageDir(): string {
  return process.env.AVATAR_STORAGE_DIR ?? DEFAULT_STORAGE_DIR;
}

function createLocalAvatarStorage(rootDir: string): AvatarStorage {
  const root = path.resolve(rootDir);

  // Keys are built by the server, but never let one point outside the root.
  function resolveKey(key: string): string {
    const filePath = path.resolve(root, key);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
      throw new Error(`Invalid avatar key: ${key}`);
    }
    return filePath;
  }

  return {
    async put(key, data) {
      const filePath = resolveKey(key);
      await mkdir(path.dirname(filePath), { recursive: true });
      // Write then rename, so a reader never sees a half-written file.
      const tempPath = `${filePath}.${randomUUID()}.tmp`;
      try {
        await writeFile(tempPath, data);
        await rename(tempPath, filePath);
      } catch (err: unknown) {
        await rm(tempPath, { force: true });
        throw err;
      }
    },

    async delete(key) {
      await rm(resolveKey(key), { force: true });
    },

    // Relative to the API base: served by GET /api/avatars/:fileName.
    getUrl(key) {
      return Promise.resolve(`/${key}`);
    },
  };
}

function getAvatarStorage(): AvatarStorage {
  return createLocalAvatarStorage(getAvatarStorageDir());
}

export { getAvatarStorage, getAvatarStorageDir, createLocalAvatarStorage };
export type { AvatarStorage };
