import { redirect, type ActionFunctionArgs } from "react-router";
import {
  isUnauthorizedError,
  parseApiError,
} from "../../shared/api/api-errors.ts";
import {
  createConversation,
  sendMessage,
  unarchiveConversation,
} from "./conversation-service.ts";
import { conversationPath } from "./paths.ts";

const EMPTY_MESSAGE_ERROR = "Message can't be empty";
const SEND_FAILED_ERROR = "Couldn't send your message. Please try again.";
const CREATE_FAILED_ERROR =
  "Couldn't start the conversation. Please try again.";
const UNARCHIVE_FAILED_ERROR =
  "Couldn't unarchive the conversation. Please try again.";

type SendMessageResult = { ok: true } | { ok: false; error: string };
type UnarchiveConversationResult = SendMessageResult;
// Success redirects to the conversation, so only failures carry data.
interface CreateConversationResult {
  ok: false;
  error: string;
}

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

// Posts the composer's message. The router revalidates the page loader
// afterwards, which refreshes both the conversation and the list.
async function sendMessageAction({
  params,
  request,
}: ActionFunctionArgs): Promise<SendMessageResult | Response> {
  const formData = await request.formData();
  const content = formString(formData, "content").trim();
  const conversationId = Number(params.conversationId);
  const recipientId = Number(formString(formData, "recipientId"));

  if (!content) return { ok: false, error: EMPTY_MESSAGE_ERROR };
  if (!isPositiveInteger(conversationId) || !isPositiveInteger(recipientId)) {
    return { ok: false, error: SEND_FAILED_ERROR };
  }

  try {
    await sendMessage(conversationId, { content, recipientId });
    return { ok: true };
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    const { message, fieldErrors } = parseApiError(error);
    return {
      ok: false,
      error: fieldErrors.content ?? message ?? SEND_FAILED_ERROR,
    };
  }
}

// Starts (or reopens) a conversation with the chosen recipient. The redirect
// navigates the page there and revalidates its loader, which refreshes the
// conversation list and the viewer together.
async function createConversationAction({
  request,
}: ActionFunctionArgs): Promise<CreateConversationResult | Response> {
  const formData = await request.formData();
  const recipientId = Number(formString(formData, "recipientId"));
  if (!isPositiveInteger(recipientId)) {
    return { ok: false, error: CREATE_FAILED_ERROR };
  }

  try {
    const id = await createConversation(recipientId);
    return redirect(conversationPath(id));
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    return {
      ok: false,
      error: parseApiError(error).message ?? CREATE_FAILED_ERROR,
    };
  }
}

// Moves an archived conversation back to the Messages list. The router
// revalidates every loader afterwards, which drops the row from the archive and
// refreshes the sidebar's unread total.
async function unarchiveConversationAction({
  request,
}: ActionFunctionArgs): Promise<UnarchiveConversationResult | Response> {
  const formData = await request.formData();
  const conversationId = Number(formString(formData, "conversationId"));
  if (!isPositiveInteger(conversationId)) {
    return { ok: false, error: UNARCHIVE_FAILED_ERROR };
  }

  try {
    await unarchiveConversation(conversationId);
    return { ok: true };
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    return { ok: false, error: UNARCHIVE_FAILED_ERROR };
  }
}

export {
  sendMessageAction,
  createConversationAction,
  unarchiveConversationAction,
};
export type {
  SendMessageResult,
  CreateConversationResult,
  UnarchiveConversationResult,
};
