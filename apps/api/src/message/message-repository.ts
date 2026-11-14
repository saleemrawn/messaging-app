import { prisma } from "../lib/prisma.ts";
import type { Message } from "../../generated/prisma/client.ts";

const deleteMessage = async (id: Message["id"]) => {
  const message = await prisma.message.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return message;
};

export { deleteMessage };
