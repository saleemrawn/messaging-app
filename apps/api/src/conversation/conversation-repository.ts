import { prisma } from "../lib/prisma.ts";
import { toAvatarUrl } from "../avatar/avatar-url.ts";
import { profileSelect, type Profile } from "../user/user-profile.ts";
import type { MessageInput } from "../types/message-types.ts";
import type {
  ConversationDetail,
  ConversationSummary,
} from "../types/conversation-types.ts";
import type {
  Conversation,
  Message,
  MessageReceipt,
  UserAccount,
} from "../../generated/prisma/client.ts";

interface FindOrCreateConversationParams {
  senderId: UserAccount["id"];
  recipientId: UserAccount["id"];
  content?: Message["content"];
}

interface FindOrCreateConversationResult {
  id: Conversation["id"];
  isCreated: boolean;
}

type AddMessageToConversationParams = MessageInput;

interface ListConversationsOptions {
  isArchived: boolean;
}

// Lists the caller's conversations newest first, each with the other
// participant, the caller's own unread count and only the latest message.
// Either the active list or the archive, never both. Empty conversations
// someone else started stay hidden from both until a message arrives.
const getConversationsByUserAccountId = async (
  userAccountId: UserAccount["id"],
  { isArchived }: ListConversationsOptions,
): Promise<ConversationSummary[]> => {
  const memberships = await prisma.userConversation.findMany({
    where: {
      userAccountId,
      isHidden: false,
      archivedAt: isArchived ? { not: null } : null,
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
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatarKey: true,
                    },
                  },
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

  return Promise.all(memberships.map(toConversationSummary));
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
        user: Pick<Profile, "firstName" | "lastName" | "avatarKey">;
      };
    }[];
  };
}

const toConversationSummary = async ({
  unreadCount,
  conversation,
}: ConversationMembership): Promise<ConversationSummary> => {
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
      avatarUrl: await toAvatarUrl(userAccount.user.avatarKey),
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

// Total unread messages across the caller's live conversations.
const getUnreadCountByUserAccountId = async (
  userAccountId: UserAccount["id"],
): Promise<number> => {
  const { _sum } = await prisma.userConversation.aggregate({
    where: {
      userAccountId,
      deletedAt: null,
      conversation: { deletedAt: null },
    },
    _sum: { unreadCount: true },
  });
  return _sum.unreadCount ?? 0;
};

// True when the account is an active participant of a live conversation.
const isConversationMember = async (
  conversationId: Conversation["id"],
  userAccountId: UserAccount["id"],
): Promise<boolean> => {
  const count = await prisma.userConversation.count({
    where: {
      conversationId,
      userAccountId,
      deletedAt: null,
      conversation: { deletedAt: null },
    },
  });
  return count > 0;
};

// The conversation as the caller sees it, or null when it doesn't exist, is
// deleted, or the caller isn't a participant.
const getConversationById = async (
  id: Conversation["id"],
  userAccountId: UserAccount["id"],
): Promise<ConversationDetail | null> => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      deletedAt: null,
      userConversations: { some: { userAccountId, deletedAt: null } },
    },
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
          messageReceipts: { select: { userAccountId: true, readAt: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      userConversations: {
        where: { userAccountId: { not: userAccountId } },
        select: {
          userAccount: {
            select: {
              id: true,
              user: {
                select: profileSelect,
              },
            },
          },
        },
        take: 1,
      },
    },
  });

  return conversation ? toConversationDetail(conversation) : null;
};

interface ConversationWithMessages {
  id: number;
  updatedAt: Date;
  messages: {
    id: number;
    content: string;
    createdAt: Date;
    userAccountId: number;
    messageReceipts: { userAccountId: number; readAt: Date }[];
  }[];
  userConversations: {
    userAccount: {
      id: number;
      user: Profile;
    };
  }[];
}

const toConversationDetail = async ({
  id,
  updatedAt,
  messages,
  userConversations,
}: ConversationWithMessages): Promise<ConversationDetail> => {
  const recipientMembership = userConversations.at(0);

  if (!recipientMembership) {
    throw new Error(`Conversation ${String(id)} has no other participant`);
  }

  const { userAccount } = recipientMembership;

  return {
    id,
    updatedAt,
    recipient: {
      id: userAccount.id,
      firstName: userAccount.user.firstName,
      lastName: userAccount.user.lastName,
      email: userAccount.user.email,
      avatarUrl: await toAvatarUrl(userAccount.user.avatarKey),
    },
    messages: messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.userAccountId,
      // In a two-person conversation the reader is whoever didn't send it.
      readAt:
        message.messageReceipts.find(
          (receipt) => receipt.userAccountId !== message.userAccountId,
        )?.readAt ?? null,
    })),
  };
};

// Returns the live conversation between the two accounts, creating it if there
// isn't one. A new conversation without content stays hidden from the
// recipient until its first message; reusing one reveals it to the caller,
// who has explicitly chosen to open it.
const findOrCreateConversation = async ({
  senderId,
  recipientId,
  content,
}: FindOrCreateConversationParams): Promise<FindOrCreateConversationResult> => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: {
        deletedAt: null,
        AND: [
          {
            userConversations: {
              some: { userAccountId: senderId, deletedAt: null },
            },
          },
          {
            userConversations: {
              some: { userAccountId: recipientId, deletedAt: null },
            },
          },
        ],
      },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await tx.userConversation.updateMany({
        where: { conversationId: existing.id, userAccountId: senderId },
        data: { isHidden: false, archivedAt: null },
      });
      return { id: existing.id, isCreated: false };
    }

    const hasContent = content !== undefined;
    const created = await tx.conversation.create({
      data: {
        userConversations: {
          create: [
            { userAccountId: senderId },
            {
              userAccountId: recipientId,
              unreadCount: hasContent ? 1 : 0,
              isHidden: !hasContent,
            },
          ],
        },
        ...(hasContent && {
          messages: { create: { content, userAccountId: senderId } },
        }),
      },
      select: { id: true },
    });
    return { id: created.id, isCreated: true };
  });
};

// Updates the caller's own membership of a live conversation. Returns false
// when the conversation doesn't exist, is deleted, or the caller isn't a
// participant.
const updateOwnMembership = async (
  conversationId: Conversation["id"],
  userAccountId: UserAccount["id"],
  data: { archivedAt: Date | null; unreadCount?: number },
): Promise<boolean> => {
  const { count } = await prisma.userConversation.updateMany({
    where: {
      conversationId,
      userAccountId,
      deletedAt: null,
      conversation: { deletedAt: null },
    },
    data,
  });
  return count > 0;
};

// Moves the conversation from the caller's list to their archive only; the
// other participant keeps it. The next message reveals it again, history
// intact.
const deleteConversation = (
  conversationId: Conversation["id"],
  userAccountId: UserAccount["id"],
): Promise<boolean> =>
  updateOwnMembership(conversationId, userAccountId, {
    archivedAt: new Date(),
    unreadCount: 0,
  });

// Moves the conversation from the caller's archive back to their list. A no-op
// for one that isn't archived.
const unarchiveConversation = (
  conversationId: Conversation["id"],
  userAccountId: UserAccount["id"],
): Promise<boolean> =>
  updateOwnMembership(conversationId, userAccountId, { archivedAt: null });

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
              isHidden: false,
              archivedAt: null,
            },
          },
          {
            where: { userAccountId: recipientId },
            data: {
              unreadCount: { increment: 1 },
              // A new message reveals a conversation started empty and brings
              // one back out of the archive.
              isHidden: false,
              archivedAt: null,
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
      where: {
        conversationId,
        userAccountId: { not: userAccountId },
        deletedAt: null,
      },
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
  getUnreadCountByUserAccountId,
  isConversationMember,
  getConversationById,
  findOrCreateConversation,
  deleteConversation,
  unarchiveConversation,
  addMessageToConversation,
  addMessageReceipts,
};
