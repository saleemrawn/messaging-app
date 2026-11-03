import type {
  Message,
  User,
  Conversation,
} from "../generated/prisma/client.ts";

interface MessageInput {
  conversationId: Conversation["id"];
  content: Message["content"];
  senderId: User["id"];
  recipientId: User["id"];
}

export type { MessageInput };
