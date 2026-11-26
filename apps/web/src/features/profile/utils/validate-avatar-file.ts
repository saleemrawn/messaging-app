// Same limits as the API, checked first so the user gets instant feedback.
const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
const AVATAR_SIZE_PX = 320;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png"];
// For <input type="file" accept>.
const AVATAR_ACCEPT = [
  ...ACCEPTED_AVATAR_TYPES,
  ...ACCEPTED_AVATAR_EXTENSIONS,
].join(",");

const UNSUPPORTED_TYPE_MESSAGE = "Image must be a JPG or PNG file";
const TOO_LARGE_MESSAGE = "Image must be 4 MB or smaller";
const EMPTY_FILE_MESSAGE = "That file is empty";

// Some systems leave a file's MIME type blank; fall back to its extension.
function isAcceptedType({ name, type }: File): boolean {
  if (type) return ACCEPTED_AVATAR_TYPES.includes(type);
  const lowerName = name.toLowerCase();
  return ACCEPTED_AVATAR_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

// A user-facing reason the file can't be used, or null when it's fine.
function validateAvatarFile(file: File): string | null {
  if (!isAcceptedType(file)) return UNSUPPORTED_TYPE_MESSAGE;
  if (file.size === 0) return EMPTY_FILE_MESSAGE;
  if (file.size > AVATAR_MAX_BYTES) return TOO_LARGE_MESSAGE;
  return null;
}

export {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  AVATAR_SIZE_PX,
  validateAvatarFile,
};
