import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import type { ApiResponse } from "../types/api-types.ts";
import type { UserResBody } from "../types/user-types.ts";
import type {
  GetAvatarReqParams,
  GetAvatarValidatedReq,
  UserAvatarReqParams,
  UserAvatarValidatedReq,
} from "../types/avatar-types.ts";
import { getAuthenticatedUserAccountId } from "../auth/auth-helpers.ts";
import { HttpError } from "../lib/http-error.ts";
import * as userRepository from "../user/user-repository.ts";
import { processAvatar } from "./avatar-processing.ts";
import {
  getAvatarStorage,
  getAvatarStorageDir,
  type AvatarStorage,
} from "./avatar-storage.ts";
import {
  AVATAR_KEY_PREFIX,
  isUploadKey,
  uploadAvatarKey,
} from "./avatar-keys.ts";

// Keys are content-hashed, so a URL's bytes never change. Public, so shared
// caches and CDNs may keep them too.
const AVATAR_CACHE_CONTROL = "public, max-age=31536000, immutable";

// Runs before the upload is parsed, so another user's file is never read.
const requireOwnAccount = (
  req: Request<UserAvatarReqParams>,
  res: Response<ApiResponse<UserResBody>>,
  next: NextFunction,
) => {
  const { id }: UserAvatarValidatedReq = matchedData(req);

  if (id !== getAuthenticatedUserAccountId(req)) {
    res.status(403).json({
      success: false,
      message: "You can only change your own profile photo",
    });
    return;
  }

  next();
};

// Cleanup failures leave an orphaned file at worst, so they're logged rather
// than failing a request whose change has already been saved.
async function deleteUpload(storage: AvatarStorage, key: string | null) {
  if (!key || !isUploadKey(key)) return;
  try {
    await storage.delete(key);
  } catch (err: unknown) {
    console.error(`Failed to delete avatar ${key}`, err);
  }
}

// Points the user at `key`; if that fails, removes the file just stored for
// it unless the user was already using it.
async function saveAvatarKey(
  storage: AvatarStorage,
  userAccountId: number,
  key: string,
  previousKey: string | null,
): Promise<UserResBody> {
  try {
    return await userRepository.setAvatarKey(userAccountId, key);
  } catch (err: unknown) {
    if (key !== previousKey) await deleteUpload(storage, key);
    throw err;
  }
}

// Stores the new photo, then points the user at it, then deletes the old
// upload, so the user never references a missing file.
const uploadAvatar = async (
  req: Request<UserAvatarReqParams>,
  res: Response<ApiResponse<UserResBody>>,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  if (!req.file) throw new HttpError(400, "Choose an image to upload");

  const avatar = await processAvatar(req.file.buffer);
  const key = uploadAvatarKey(userAccountId, avatar.hash, avatar.extension);
  const storage = getAvatarStorage();
  const previousKey = await userRepository.getAvatarKey(userAccountId);

  await storage.put(key, avatar.data, avatar.contentType);
  const user = await saveAvatarKey(storage, userAccountId, key, previousKey);
  if (previousKey !== key) await deleteUpload(storage, previousKey);

  res.status(200).json({ success: true, data: user });
};

// Seed photos are shared assets, so only the user's own upload is deleted.
const removeAvatar = async (
  req: Request<UserAvatarReqParams>,
  res: Response<ApiResponse<UserResBody>>,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  const previousKey = await userRepository.getAvatarKey(userAccountId);

  const user = await userRepository.setAvatarKey(userAccountId, null);
  await deleteUpload(getAvatarStorage(), previousKey);

  res.status(200).json({ success: true, data: user });
};

function isNotFoundError(err: Error): boolean {
  return "statusCode" in err && err.statusCode === 404;
}

// Serves files from the local storage folder. A CDN adapter would serve its
// own URLs and leave this route unused.
const getAvatar = (
  req: Request<GetAvatarReqParams>,
  res: Response<ApiResponse<never>>,
  next: NextFunction,
) => {
  const { fileName }: GetAvatarValidatedReq = matchedData(req);

  res.sendFile(
    fileName,
    {
      root: path.join(getAvatarStorageDir(), AVATAR_KEY_PREFIX),
      dotfiles: "deny",
      cacheControl: false,
      headers: {
        "Cache-Control": AVATAR_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    },
    (err?: Error) => {
      if (!err || res.headersSent) return;
      if (isNotFoundError(err)) {
        res.status(404).json({ success: false, message: "Avatar not found" });
        return;
      }
      next(err);
    },
  );
};

export { requireOwnAccount, uploadAvatar, removeAvatar, getAvatar };
