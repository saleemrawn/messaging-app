import { prisma } from "../lib/prisma.ts";

const getUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

export { getUsers };
