import { prisma } from "../lib/prisma.ts";
import type { User, UserAccount } from "../../types/user-types.ts";

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

const getUser = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
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
  id,
  firstName,
  lastName,
  email,
}: Pick<User, "id" | "firstName" | "lastName" | "email">) => {
  const user = await prisma.user.update({
    where: { id },
    data: { firstName, lastName, email },
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

const deleteUser = async (id: number) => {
  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
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

export { getUsers, getUser, createUser, updateUser, deleteUser };
