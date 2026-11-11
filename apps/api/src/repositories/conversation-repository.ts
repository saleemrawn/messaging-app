import { prisma } from "../lib/prisma.ts";
import type { MessageInput } from "../../types/message-types.ts";
import type {
  Conversation,
  MessageReceipt,
  UserAccount,
} from "../../generated/prisma/client.ts";

type CreateConversationParams = Omit<MessageInput, "conversationId">;
type AddMessageToConversationParams = MessageInput;

const getConversationsByUserAccountId = async (
  userAccountId: UserAccount["id"],
) => {
  const conversations = await prisma.conversation.findMany({
    where: { deletedAt: null, userConversations: { some: { userAccountId } } },
    select: {
      id: true,
      updatedAt: true,
      messages: {
        select: { id: true, content: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      userConversations: {
        where: { userAccountId: { not: userAccountId } },
        select: {
          userAccount: {
            select: {
              id: true,
              deletedAt: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations;
};

const getConversationById = async (id: Conversation["id"]) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      updatedAt: true,
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          userAccount: {
            select: {
              id: true,
              deletedAt: true,
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      userConversations: {
        select: { id: true, userAccountId: true, unreadCount: true },
      },
    },
  });
  return conversation;
};

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
        orderBy: { createdAt: "asc" },
      },
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return conversation;
};

const deleteConversation = async (id: Conversation["id"]) => {
  const conversation = await prisma.conversation.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
  return conversation;
};

const addMessageToConversation = async ({
  conversationId,
  content,
  senderId,
  recipientId,
}: AddMessageToConversationParams) => {
  if (!conversationId) {
    throw new Error(
      `Error: expected conversationId of type number, received ${typeof conversationId}`,
    );
  }

  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      messages: {
        create: { content, userAccountId: senderId },
      },
      userConversations: {
        updateMany: [
          {
            where: { userAccountId: senderId },
            data: {
              unreadCount: 0,
            },
          },
          {
            where: { userAccountId: recipientId },
            data: {
              unreadCount: { increment: 1 },
            },
          },
        ],
      },
    },
    select: {
      id: true,
      userConversations: {
        select: {
          id: true,
          unreadCount: true,
        },
        orderBy: { id: "asc" },
      },
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return conversation;
};

const addMessageReceipts = async ({
  conversationId,
  userAccountId,
}: {
  conversationId: Conversation["id"];
  userAccountId: MessageReceipt["id"];
}) => {
  return await prisma.$transaction(async (tx) => {
    const messages = await tx.message.findMany({
      where: { conversationId, userAccountId: { not: userAccountId } },
      select: { id: true },
    });

    const messageIds = messages.map((m) => m.id);

    const receipts = await tx.messageReceipt.createManyAndReturn({
      data: messageIds.map((id) => ({
        messageId: id,
        userAccountId,
        readAt: new Date(),
      })),
      select: { id: true, messageId: true, userAccountId: true, readAt: true },
      skipDuplicates: true,
    });

    await tx.userConversation.updateMany({
      where: { userAccountId },
      data: { unreadCount: 0 },
    });

    return receipts;
  });
};

export {
  getConversationsByUserAccountId,
  getConversationById,
  createConversation,
  deleteConversation,
  addMessageToConversation,
  addMessageReceipts,
};
