import type {
  Message,
  User,
  Conversation,
  UserAccount,
} from "../../generated/prisma/client.ts";

interface MessageInput {
  conversationId: Conversation["id"];
  content: Message["content"];
  senderId: User["id"];
  recipientId: User["id"];
}

interface DeleteMessageInput {
  id: Message["id"];
  userAccountId: UserAccount["id"];
}

interface DeleteMessageReqParams {
  id: Message["id"];
}

interface DeleteMessageResBody {
  id: Message["id"];
  deletedAt: Message["deletedAt"];
}

export type {
  MessageInput,
  DeleteMessageInput,
  DeleteMessageReqParams,
  DeleteMessageResBody,
};
