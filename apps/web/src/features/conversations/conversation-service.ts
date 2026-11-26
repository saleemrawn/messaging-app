import { api } from "../../shared/api/client.ts";
import type { ApiResponse } from "../../shared/api/types.ts";
import type {
  ConversationDetail,
  ConversationSummary,
  NewMessage,
} from "./types.ts";

// The caller's conversations, newest first, as ordered by the API.
async function getConversations(): Promise<ConversationSummary[]> {
  const res = await api.get<ApiResponse<ConversationSummary[]>>(
    "/conversations",
  );
  return res.data.success ? (res.data.data ?? []) : [];
}

// The caller's archived conversations, newest first.
async function getArchivedConversations(): Promise<ConversationSummary[]> {
  const res = await api.get<ApiResponse<ConversationSummary[]>>(
    "/conversations/archived",
  );
  return res.data.success ? (res.data.data ?? []) : [];
}

// Moves the conversation from the caller's archive back to their list.
async function unarchiveConversation(id: number): Promise<void> {
  await api.post<ApiResponse<unknown>>(
    `/conversations/${String(id)}/unarchive`,
  );
}

// Moves the conversation from the caller's list to their archive. The other
// participant keeps it.
async function archiveConversation(id: number): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/conversations/${String(id)}`);
}

// Total unread messages across all of the caller's conversations.
async function getUnreadCount(): Promise<number> {
  const res = await api.get<ApiResponse<{ unreadCount: number }>>(
    "/conversations/unread-count",
  );
  return res.data.success ? (res.data.data?.unreadCount ?? 0) : 0;
}

// One conversation as the caller sees it, messages oldest first.
async function getConversation(id: number): Promise<ConversationDetail> {
  const res = await api.get<ApiResponse<ConversationDetail>>(
    `/conversations/${String(id)}`,
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(`Conversation ${String(id)} could not be loaded`);
  }
  return res.data.data;
}

// Adds read receipts for the other participant's messages and resets the
// caller's unread count. Safe to repeat.
async function markConversationRead(id: number): Promise<void> {
  await api.post<ApiResponse<unknown>>(
    `/conversations/${String(id)}/messages/receipts`,
  );
}

async function sendMessage(id: number, message: NewMessage): Promise<void> {
  await api.post<ApiResponse<unknown>, NewMessage>(
    `/conversations/${String(id)}/messages`,
    message,
  );
}

// Starts a conversation with the recipient, or returns the one the caller
// already has with them. Resolves to its id.
async function createConversation(recipientId: number): Promise<number> {
  const res = await api.post<
    ApiResponse<{ id: number }>,
    { recipientId: number }
  >("/conversations", { recipientId });
  if (!res.data.success || !res.data.data) {
    throw new Error("Conversation could not be created");
  }
  return res.data.data.id;
}

export {
  createConversation,
  getConversations,
  getArchivedConversations,
  archiveConversation,
  unarchiveConversation,
  getUnreadCount,
  getConversation,
  markConversationRead,
  sendMessage,
};
