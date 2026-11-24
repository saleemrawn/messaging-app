import { isAxiosError } from "axios";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { isUnauthorizedError } from "../../shared/api/api-errors.ts";
import {
  getConversation,
  getConversations,
  markConversationRead,
} from "./conversation-service.ts";
import { CONVERSATIONS_PATH, conversationPath } from "./paths.ts";
import type { ConversationDetail, ConversationSummary } from "./types.ts";

const HTTP_NOT_FOUND = 404;

interface MessagesPageData {
  conversations: ConversationSummary[];
  conversation: ConversationDetail | null;
}

function parseConversationId(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// With no conversation in the URL, select the newest one.
async function loadNewestConversation(): Promise<MessagesPageData | Response> {
  const conversations = await getConversations();
  const newest = conversations.at(0);
  return newest
    ? redirect(conversationPath(newest.id))
    : { conversations, conversation: null };
}

// Opening a conversation reads it, so receipts are written first; the list is
// fetched afterwards so its unread badge is already cleared.
async function loadSelectedConversation(id: number): Promise<MessagesPageData> {
  await markConversationRead(id);
  const [conversations, conversation] = await Promise.all([
    getConversations(),
    getConversation(id),
  ]);
  return { conversations, conversation };
}

// Runs in parallel with the layout's auth check, so a 401 here redirects too
// instead of surfacing on the error page. Unknown or foreign conversations fall
// back to the default selection; anything else goes to the ErrorBoundary.
async function messagesPageLoader({
  params,
}: LoaderFunctionArgs): Promise<MessagesPageData | Response> {
  const hasIdParam = params.conversationId !== undefined;
  const id = parseConversationId(params.conversationId);
  if (hasIdParam && id === null) return redirect(CONVERSATIONS_PATH);

  try {
    return id === null
      ? await loadNewestConversation()
      : await loadSelectedConversation(id);
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    if (isAxiosError(error) && error.response?.status === HTTP_NOT_FOUND) {
      return redirect(CONVERSATIONS_PATH);
    }
    throw error;
  }
}

export { messagesPageLoader };
export type { MessagesPageData };
