interface ConversationRecipient {
  id: number;
  firstName: string;
  lastName: string;
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
  recipient: ConversationRecipient;
  messages: ConversationMessage[];
}

interface NewMessage {
  content: string;
  recipientId: number;
}

export type {
  ConversationRecipient,
  ConversationSummary,
  ConversationDetail,
  ConversationMessage,
  LatestMessage,
  NewMessage,
};
