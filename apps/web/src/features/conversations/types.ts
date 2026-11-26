import type { UserSummary } from "../users/types.ts";

interface ConversationRecipient {
  id: number;
  firstName: string;
  lastName: string;
}

// The detail view also shows how to reach them.
interface ConversationDetailRecipient extends ConversationRecipient {
  email: string;
}

interface LatestMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
}

interface ConversationSummary {
  id: number;
  updatedAt: string;
  unreadCount: number;
  recipient: ConversationRecipient;
  latestMessage: LatestMessage | null;
}

interface ConversationMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  // When the other participant read it; null while unread.
  readAt: string | null;
}

interface ConversationDetail {
  id: number;
  updatedAt: string;
  recipient: ConversationDetailRecipient;
  messages: ConversationMessage[];
}

// Someone the caller can start a conversation with, found by email.
type Recipient = UserSummary;

interface NewMessage {
  content: string;
  recipientId: number;
}

export type {
  ConversationRecipient,
  ConversationDetailRecipient,
  ConversationSummary,
  ConversationDetail,
  ConversationMessage,
  LatestMessage,
  NewMessage,
  Recipient,
};
