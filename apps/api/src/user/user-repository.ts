import { prisma } from "../lib/prisma.ts";
import type {
  UserAccount,
  UserResBody,
  CreateUserReqBody,
  UpdateUserReqBody,
} from "../types/user-types.ts";

const accountSelect = {
  id: true,
  username: true,
  user: { select: { firstName: true, lastName: true, email: true } },
} as const;

const toUserResBody = (account: {
  id: number;
  username: string;
  user: { firstName: string; lastName: string; email: string };
}): UserResBody => ({
  id: account.id,
  username: account.username,
  firstName: account.user.firstName,
  lastName: account.user.lastName,
  email: account.user.email,
});

const getUsers = async () => {
  const accounts = await prisma.userAccount.findMany({
    select: accountSelect,
    orderBy: { id: "asc" },
  });
  return accounts.map(toUserResBody);
};

const getUserByAccountId = async (userAccountId: UserAccount["id"]) => {
  const account = await prisma.userAccount.findFirst({
    where: { id: userAccountId, deletedAt: null, user: { deletedAt: null } },
    select: accountSelect,
  });
  return account ? toUserResBody(account) : null;
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

const updateUser = async ({
  userAccountId,
  firstName,
  lastName,
  email,
}: UpdateUserReqBody & { userAccountId: UserAccount["id"] }) => {
  const account = await prisma.userAccount.update({
    where: { id: userAccountId },
    data: { user: { update: { firstName, lastName, email } } },
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
  getUserCredentialsByUsername,
  createUser,
  updateUser,
  deleteUser,
};
