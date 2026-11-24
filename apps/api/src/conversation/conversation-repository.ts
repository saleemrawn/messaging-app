import { prisma } from "../lib/prisma.ts";
import type { MessageInput } from "../types/message-types.ts";
import type { ConversationSummary } from "../types/conversation-types.ts";
import type {
  Conversation,
  MessageReceipt,
  UserAccount,
} from "../../generated/prisma/client.ts";

type CreateConversationParams = Omit<MessageInput, "conversationId">;
type AddMessageToConversationParams = MessageInput;

// Lists the caller's conversations newest first, each with the other
// participant, the caller's own unread count and only the latest message.
const getConversationsByUserAccountId = async (
  userAccountId: UserAccount["id"],
): Promise<ConversationSummary[]> => {
  const memberships = await prisma.userConversation.findMany({
    where: {
      userAccountId,
      deletedAt: null,
      conversation: { deletedAt: null },
    },
    select: {
      unreadCount: true,
      conversation: {
        select: {
          id: true,
          updatedAt: true,
          messages: {
            where: { deletedAt: null },
            select: {
              id: true,
              content: true,
              createdAt: true,
              userAccountId: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          userConversations: {
            where: { userAccountId: { not: userAccountId } },
            select: {
              userAccount: {
                select: {
                  id: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return memberships.map(toConversationSummary);
};

interface ConversationMembership {
  unreadCount: number;
  conversation: {
    id: number;
    updatedAt: Date;
    messages: {
      id: number;
      content: string;
      createdAt: Date;
      userAccountId: number;
    }[];
    userConversations: {
      userAccount: {
        id: number;
        user: { firstName: string; lastName: string };
      };
    }[];
  };
}

const toConversationSummary = ({
  unreadCount,
  conversation,
}: ConversationMembership): ConversationSummary => {
  const latestMessage = conversation.messages.at(0);
  const recipientMembership = conversation.userConversations.at(0);

  if (!recipientMembership) {
    throw new Error(
      `Conversation ${String(conversation.id)} has no other participant`,
    );
  }

  const { userAccount } = recipientMembership;

  return {
    id: conversation.id,
    updatedAt: conversation.updatedAt,
    unreadCount,
    recipient: {
      id: userAccount.id,
      firstName: userAccount.user.firstName,
      lastName: userAccount.user.lastName,
    },
    latestMessage: latestMessage
      ? {
          id: latestMessage.id,
          content: latestMessage.content,
          createdAt: latestMessage.createdAt,
          senderId: latestMessage.userAccountId,
        }
      : null,
  };
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
      // Set explicitly: Prisma doesn't bump @updatedAt for nested-only writes,
      // and the conversation list is sorted by it.
      updatedAt: new Date(),
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
      where: { userAccountId, conversationId },
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
