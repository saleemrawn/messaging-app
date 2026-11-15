import type {
  Message,
  User,
  Conversation,
} from "../../generated/prisma/client.ts";

interface MessageInput {
  conversationId: Conversation["id"];
  content: Message["content"];
  senderId: User["id"];
  recipientId: User["id"];
}

interface DeleteMessageReqParams {
  id: Message["id"];
}

interface DeleteMessageResBody {
  id: Message["id"];
  deletedAt: Message["deletedAt"];
}

export type { MessageInput, DeleteMessageReqParams, DeleteMessageResBody };
