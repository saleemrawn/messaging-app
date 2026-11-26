import { getAvatarStorage } from "./avatar-storage.ts";

// The URL clients load an avatar from, or null to show initials. Responses
// never expose the storage key itself.
async function toAvatarUrl(avatarKey: string | null): Promise<string | null> {
  return avatarKey ? getAvatarStorage().getUrl(avatarKey) : null;
}

export { toAvatarUrl };
