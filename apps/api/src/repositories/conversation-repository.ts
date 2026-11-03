import { prisma } from "../lib/prisma.ts";
import type { MessageInput } from "../../types/message-types.ts";

type CreateConversationParams = Omit<MessageInput, "conversationId">;

const createConversation = async ({
  content,
  senderId,
  recipientId,
}: CreateConversationParams) => {
  const conversation = await prisma.conversation.create({
    data: {
      userConversations: {
        create: [
          { userAccountId: senderId },
          { userAccountId: recipientId, unreadCount: 1 },
        ],
      },
      messages: {
        create: { content, userAccountId: senderId },
      },
    },
    select: {
      id: true,
      userConversations: {
        select: {
          id: true,
          unreadCount: true,
        },
      },
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });
  return conversation;
};

export { createConversation };
