import { prisma } from "../lib/prisma.ts";
import type { User, UserAccount } from "../types/user-types.ts";

const accountSelect = {
  id: true,
  username: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

const toUserWithAccount = (account: {
  id: number;
  username: string;
  user: { id: number; firstName: string; lastName: string; email: string };
}) => ({
  ...account.user,
  userAccount: { id: account.id, username: account.username },
});

const getUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userAccount: {
        select: { id: true, username: true },
      },
    },
  });
  return users;
};

const getUserByAccountId = async (userAccountId: UserAccount["id"]) => {
  const account = await prisma.userAccount.findFirst({
    where: { id: userAccountId, deletedAt: null, user: { deletedAt: null } },
    select: accountSelect,
  });
  return account ? toUserWithAccount(account) : null;
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

const createUser = async ({
  firstName,
  lastName,
  email,
  username,
  password,
}: Pick<
  UserAccount,
  "firstName" | "lastName" | "email" | "username" | "password"
>) => {
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      userAccount: { create: { username, password } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userAccount: {
        select: { id: true, username: true },
      },
    },
  });
  return user;
};

const updateUser = async ({
  userAccountId,
  firstName,
  lastName,
  email,
}: Pick<User, "firstName" | "lastName" | "email"> & {
  userAccountId: UserAccount["id"];
}) => {
  const account = await prisma.userAccount.update({
    where: { id: userAccountId },
    data: { user: { update: { firstName, lastName, email } } },
    select: accountSelect,
  });
  return toUserWithAccount(account);
};

const deleteUser = async (userAccountId: UserAccount["id"]) => {
  const deletedAt = new Date();
  const account = await prisma.userAccount.update({
    where: { id: userAccountId },
    data: { deletedAt, user: { update: { deletedAt } } },
    select: accountSelect,
  });
  return toUserWithAccount(account);
};

export {
  getUsers,
  getUserByAccountId,
  getUserCredentialsByUsername,
  createUser,
  updateUser,
  deleteUser,
};
