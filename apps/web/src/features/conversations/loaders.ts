import { isAxiosError } from "axios";
import {
  matchPath,
  redirect,
  type LoaderFunctionArgs,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { isUnauthorizedError } from "../../shared/api/api-errors.ts";
import {
  findRecipientByEmail,
  getArchivedConversations,
  getConversation,
  getConversations,
  getUnreadCount,
  markConversationRead,
} from "./conversation-service.ts";
import {
  CONVERSATIONS_PATH,
  MESSAGES_ROUTE_PATH,
  conversationPath,
} from "./paths.ts";
import type {
  ConversationDetail,
  ConversationSummary,
  Recipient,
} from "./types.ts";

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

// Route ids whose loader data feeds the sidebar's unread total.
const MESSAGES_ROUTE_ID = "messages";
const UNREAD_COUNT_ROUTE_ID = "unread-count";

interface MessagesPageData {
  conversations: ConversationSummary[];
  conversation: ConversationDetail | null;
}

// Carries the email it answers for, so the dialog can ignore a result that
// arrives after the input has changed.
type RecipientLookupResult =
  | { email: string; status: "found"; recipient: Recipient }
  | { email: string; status: "not-found" }
  | { email: string; status: "error" };

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

function isNoSuchRecipientError(error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === HTTP_NOT_FOUND || status === HTTP_BAD_REQUEST;
}

// Loaded by the new conversation dialog's fetcher. Failures become a status
// the dialog can show rather than reaching the error page.
async function recipientLookupLoader({
  request,
}: LoaderFunctionArgs): Promise<RecipientLookupResult | Response> {
  const email = new URL(request.url).searchParams.get("email")?.trim() ?? "";
  // Only reachable by typing the URL; there is no page to show.
  if (!email) return redirect(CONVERSATIONS_PATH);

  try {
    const recipient = await findRecipientByEmail(email);
    return { email, status: "found", recipient };
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    if (isNoSuchRecipientError(error)) return { email, status: "not-found" };
    return { email, status: "error" };
  }
}

// Runs in parallel with the layout's auth check, so a 401 redirects too.
async function archivePageLoader(): Promise<ConversationSummary[] | Response> {
  try {
    return await getArchivedConversations();
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    throw error;
  }
}

// Runs in parallel with the layout's auth check, so a 401 redirects too.
async function unreadCountLoader(): Promise<number | Response> {
  try {
    return await getUnreadCount();
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    throw error;
  }
}

// A pathless parent's loader doesn't re-run on plain navigation, so its count
// would go stale once conversations are read. Refresh it whenever navigation
// lands outside the messages page, which derives the total from its own list.
function shouldRevalidateUnreadCount({
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  return (
    defaultShouldRevalidate ||
    matchPath(MESSAGES_ROUTE_PATH, nextUrl.pathname) === null
  );
}

export {
  MESSAGES_ROUTE_ID,
  UNREAD_COUNT_ROUTE_ID,
  messagesPageLoader,
  archivePageLoader,
  recipientLookupLoader,
  unreadCountLoader,
  shouldRevalidateUnreadCount,
};
export type { MessagesPageData, RecipientLookupResult };
