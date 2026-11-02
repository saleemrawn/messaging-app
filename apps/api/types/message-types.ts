import type { Message, User } from "../generated/prisma/client.ts";

interface MessageInput {
  content: Message["content"];
  senderId: User["id"];
  recipientId: User["id"];
}

export type { MessageInput };
