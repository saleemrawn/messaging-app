import { isAxiosError } from "axios";
import {
  matchPath,
  redirect,
  type LoaderFunctionArgs,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import { isUnauthorizedError } from "../../shared/api/api-errors.ts";
import {
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
import type { ConversationDetail, ConversationSummary } from "./types.ts";
import { lookUpUser, type UserLookupResult } from "../users/lookup.ts";
import { getContacts } from "../contacts/contacts-service.ts";
import type { Contact } from "../contacts/types.ts";

const HTTP_NOT_FOUND = 404;

// Route ids whose loader data feeds the sidebar's unread total.
const MESSAGES_ROUTE_ID = "messages";
const UNREAD_COUNT_ROUTE_ID = "unread-count";

// A failure carries no detail: the dialog only says the list couldn't load.
type ContactListResult = { ok: true; contacts: Contact[] } | { ok: false };

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

// Loaded by the new conversation dialog's fetcher.
function recipientLookupLoader({
  request,
}: LoaderFunctionArgs): Promise<UserLookupResult | Response> {
  return lookUpUser(request, CONVERSATIONS_PATH);
}

// Loaded by the new conversation dialog's contacts fetcher. Failures become a
// result the dialog can show rather than reaching the error page.
async function conversationContactsLoader(): Promise<
  ContactListResult | Response
> {
  try {
    return { ok: true, contacts: await getContacts() };
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    return { ok: false };
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
  conversationContactsLoader,
  unreadCountLoader,
  shouldRevalidateUnreadCount,
};
export type { ContactListResult, MessagesPageData };
