import { toAvatarUrl } from "../avatar/avatar-url.ts";
import type { LookupUserResBody } from "../types/user-types.ts";

// The profile fields shared by every user shape the API returns. Spread into
// a Prisma `user: { select }`.
const profileSelect = {
  firstName: true,
  lastName: true,
  email: true,
  avatarKey: true,
} as const;

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  avatarKey: string | null;
}

// A user as shown to others: account id, name, email and avatar URL. The
// storage key itself is never exposed.
const toLookupUserResBody = async (account: {
  id: number;
  user: Profile;
}): Promise<LookupUserResBody> => {
  const { avatarKey, ...profile } = account.user;
  return {
    id: account.id,
    ...profile,
    avatarUrl: await toAvatarUrl(avatarKey),
  };
};

export { profileSelect, toLookupUserResBody };
export type { Profile };
