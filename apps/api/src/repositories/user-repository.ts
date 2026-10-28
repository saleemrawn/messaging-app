import { prisma } from "../lib/prisma.ts";

const getUsers = async () => {
  const users = await prisma.user.findMany();
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
}: {
  firstName: string;
  lastName: string;
  email: string;
}) => {
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
}: {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}) => {
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
