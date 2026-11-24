import { api } from "../../adapters/api.ts";
import type {
  ApiResponse,
  ConversationDetail,
  ConversationSummary,
  NewMessage,
} from "../types/api.ts";

// The caller's conversations, newest first, as ordered by the API.
async function getConversations(): Promise<ConversationSummary[]> {
  const res = await api.get<ApiResponse<ConversationSummary[]>>(
    "/conversations",
  );
  return res.data.success ? (res.data.data ?? []) : [];
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

export { getConversations, getConversation, markConversationRead, sendMessage };
