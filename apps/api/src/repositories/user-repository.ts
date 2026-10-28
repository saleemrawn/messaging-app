import { prisma } from "../lib/prisma.ts";
import type { User } from "../../types/user-types.ts";

const getUsers = async () => {
  const users = await prisma.user.findMany({
    include: { userAccount: { omit: { password: true } } },
  });
  return users;
};

const getUser = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

const createUser = async ({
  firstName,
  lastName,
  email,
}: Pick<User, "firstName" | "lastName" | "email">) => {
  const user = await prisma.user.create({
    data: { firstName, lastName, email },
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
  });
  return user;
};

const deleteUser = async (id: number) => {
  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return user;
};

export { getUsers, getUser, createUser, updateUser, deleteUser };
