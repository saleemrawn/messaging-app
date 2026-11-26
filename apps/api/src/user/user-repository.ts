import { prisma } from "../lib/prisma.ts";
import { toAvatarUrl } from "../avatar/avatar-url.ts";
import {
  profileSelect,
  toLookupUserResBody,
  type Profile,
} from "./user-profile.ts";
import type {
  UserAccount,
  User,
  UserResBody,
  LookupUserResBody,
  CreateUserReqBody,
  UpdateUserReqBody,
} from "../types/user-types.ts";

const accountSelect = {
  id: true,
  username: true,
  user: { select: profileSelect },
} as const;

const toUserResBody = async (account: {
  id: number;
  username: string;
  user: Profile;
}): Promise<UserResBody> => ({
  id: account.id,
  username: account.username,
  firstName: account.user.firstName,
  lastName: account.user.lastName,
  email: account.user.email,
  avatarUrl: await toAvatarUrl(account.user.avatarKey),
});

const getUsers = async () => {
  const accounts = await prisma.userAccount.findMany({
    select: accountSelect,
    orderBy: { id: "asc" },
  });
  return Promise.all(accounts.map(toUserResBody));
};

const getUserByAccountId = async (userAccountId: UserAccount["id"]) => {
  const account = await prisma.userAccount.findFirst({
    where: { id: userAccountId, deletedAt: null, user: { deletedAt: null } },
    select: accountSelect,
  });
  return account ? toUserResBody(account) : null;
};

// The active account whose email matches exactly (case-insensitive), skipping
// the caller so they can't look themselves up as a recipient.
const findUserByEmail = async (
  email: User["email"],
  excludeUserAccountId: UserAccount["id"],
): Promise<LookupUserResBody | null> => {
  const account = await prisma.userAccount.findFirst({
    where: {
      id: { not: excludeUserAccountId },
      deletedAt: null,
      user: { deletedAt: null, email: { equals: email, mode: "insensitive" } },
    },
    select: { id: true, user: { select: profileSelect } },
  });

  return account ? toLookupUserResBody(account) : null;
};

const getUserCredentialsByUsername = async (
  username: UserAccount["username"],
) => {
  const user = await prisma.userAccount.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
    },
  });
  return user;
};

const getPasswordHashByAccountId = async (userAccountId: UserAccount["id"]) => {
  return prisma.userAccount.findFirst({
    where: { id: userAccountId, deletedAt: null },
    select: { password: true },
  });
};

const createUser = async ({
  firstName,
  lastName,
  email,
  username,
  password,
}: CreateUserReqBody) => {
  const account = await prisma.userAccount.create({
    data: {
      username,
      password,
      user: { create: { firstName, lastName, email } },
    },
    select: accountSelect,
  });
  return toUserResBody(account);
};

// `password` must already be hashed; leave it out to keep the current one.
const updateUser = async ({
  userAccountId,
  firstName,
  lastName,
  email,
  password,
}: Pick<UpdateUserReqBody, "firstName" | "lastName" | "email"> & {
  userAccountId: UserAccount["id"];
  password?: UserAccount["password"];
}) => {
  const account = await prisma.userAccount.update({
    where: { id: userAccountId },
    data: {
      ...(password && { password }),
      user: { update: { firstName, lastName, email } },
    },
    select: accountSelect,
  });
  return toUserResBody(account);
};

// The active account's avatar key, or null when it has none (or is gone).
const getAvatarKey = async (
  userAccountId: UserAccount["id"],
): Promise<string | null> => {
  const account = await prisma.userAccount.findFirst({
    where: { id: userAccountId, deletedAt: null },
    select: { user: { select: { avatarKey: true } } },
  });
  return account?.user.avatarKey ?? null;
};

// Pass null to clear the avatar. Throws P2025 (404) for a missing account.
const setAvatarKey = async (
  userAccountId: UserAccount["id"],
  avatarKey: string | null,
) => {
  const account = await prisma.userAccount.update({
    where: { id: userAccountId, deletedAt: null },
    data: { user: { update: { avatarKey } } },
    select: accountSelect,
  });
  return toUserResBody(account);
};

const deleteUser = async (userAccountId: UserAccount["id"]) => {
  const deletedAt = new Date();
  const account = await prisma.userAccount.update({
    where: { id: userAccountId },
    data: { deletedAt, user: { update: { deletedAt } } },
    select: accountSelect,
  });
  return toUserResBody(account);
};

export {
  getUsers,
  getUserByAccountId,
  findUserByEmail,
  getUserCredentialsByUsername,
  getPasswordHashByAccountId,
  createUser,
  updateUser,
  getAvatarKey,
  setAvatarKey,
  deleteUser,
};
