import { api } from "../../adapters/api.ts";
import type { ApiResponse, ConversationSummary } from "../types/api.ts";

// The caller's conversations, newest first, as ordered by the API.
async function getConversations(): Promise<ConversationSummary[]> {
  const res = await api.get<ApiResponse<ConversationSummary[]>>(
    "/conversations",
  );
  return res.data.success ? (res.data.data ?? []) : [];
}

export { getConversations };
