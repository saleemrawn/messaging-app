import { prisma } from "../lib/prisma.ts";

const getUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

const getUser = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

export { getUsers, getUser };
