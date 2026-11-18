import { prisma } from "../lib/prisma.ts";
import type { DeleteMessageInput } from "../types/message-types.ts";

const deleteMessage = async ({ id, userAccountId }: DeleteMessageInput) => {
  const deletedAt = new Date();

  const { count } = await prisma.message.updateMany({
    where: { id, userAccountId, deletedAt: null },
    data: { deletedAt },
  });

  if (count === 0) {
    return null;
  }

  return { id, deletedAt };
};

export { deleteMessage };
