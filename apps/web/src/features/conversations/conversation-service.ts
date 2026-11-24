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

export {
  getConversations,
  getUnreadCount,
  getConversation,
  markConversationRead,
  sendMessage,
};
