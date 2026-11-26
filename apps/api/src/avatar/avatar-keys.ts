// Avatar keys are provider-neutral object keys stored on User.avatarKey, e.g.
// "avatars/seed-01.jpg" or "avatars/user-12-3f9a1c7e5b2d4a60.png". They map
// onto local files today and onto bucket objects if storage moves to a CDN.

type AvatarExtension = "jpg" | "png";

const AVATAR_KEY_PREFIX = "avatars/";
const AVATAR_HASH_LENGTH = 16;

// The only names the avatar route will serve: seed files and hashed uploads.
const AVATAR_FILE_NAME_PATTERN =
  /^(?:seed-\d{2}|user-\d+-[a-f0-9]{16})\.(?:jpg|jpeg|png)$/;
const UPLOAD_KEY_PATTERN = /^avatars\/user-\d+-[a-f0-9]{16}\.(?:jpg|png)$/;

function seedAvatarKey(fileName: string): string {
  return `${AVATAR_KEY_PREFIX}${fileName}`;
}

// The hash is a fingerprint of the stored image, so a new photo always gets a
// new key and URL, and the old one can be cached forever.
function uploadAvatarKey(
  userAccountId: number,
  hash: string,
  extension: AvatarExtension,
): string {
  return `${AVATAR_KEY_PREFIX}user-${String(userAccountId)}-${hash}.${extension}`;
}

// Uploads are owned by one user and deleted when replaced; seed files are not.
function isUploadKey(key: string): boolean {
  return UPLOAD_KEY_PATTERN.test(key);
}

export {
  AVATAR_KEY_PREFIX,
  AVATAR_HASH_LENGTH,
  AVATAR_FILE_NAME_PATTERN,
  seedAvatarKey,
  uploadAvatarKey,
  isUploadKey,
};
export type { AvatarExtension };
