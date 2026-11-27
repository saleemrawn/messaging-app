import { redirect, replace, type ActionFunctionArgs } from "react-router";
import {
  isUnauthorizedError,
  parseApiError,
} from "../../shared/api/api-errors.ts";
import {
  archiveConversation,
  createConversation,
  sendMessage,
  unarchiveConversation,
} from "./conversation-service.ts";
import { CONVERSATIONS_PATH, conversationPath } from "./paths.ts";
import { addContact } from "../contacts/contacts-service.ts";
import {
  showErrorToast,
  showSuccessToast,
} from "../../shared/utils/toast.ts";

const EMPTY_MESSAGE_ERROR = "Message can't be empty";
const SEND_FAILED_ERROR = "Couldn't send your message. Please try again.";
const CREATE_FAILED_ERROR =
  "Couldn't start the conversation. Please try again.";
const UNARCHIVE_FAILED_ERROR =
  "Couldn't unarchive the conversation. Please try again.";
const ARCHIVE_FAILED_ERROR =
  "Couldn't archive the conversation. Please try again.";
const ADD_CONTACT_FAILED_ERROR = "Couldn't add the contact. Please try again.";
const UNARCHIVED_MESSAGE = "Conversation moved to Messages";
const ARCHIVED_MESSAGE = "Conversation archived";

type SendMessageResult = { ok: true } | { ok: false; error: string };
// These actions report failures with a toast, so the result only says whether
// it worked.
interface ActionOutcome {
  ok: boolean;
}
type UnarchiveConversationResult = ActionOutcome;
// Success redirects to the next conversation, so data only carries a failure.
interface ArchiveConversationResult {
  ok: false;
}
type AddRecipientContactResult = ActionOutcome;
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
    showErrorToast(UNARCHIVE_FAILED_ERROR);
    return { ok: false };
  }

  try {
    await unarchiveConversation(conversationId);
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    showErrorToast(UNARCHIVE_FAILED_ERROR);
    return { ok: false };
  }

  showSuccessToast(UNARCHIVED_MESSAGE);
  return { ok: true };
}

// Moves the open conversation to the archive, then opens the one the viewer
// chose to show next. Replacing the history entry keeps Back from returning to
// the archived conversation. The redirect revalidates every loader, which drops
// it from the list and refreshes the sidebar's unread total.
async function archiveConversationAction({
  params,
  request,
}: ActionFunctionArgs): Promise<ArchiveConversationResult | Response> {
  const formData = await request.formData();
  const conversationId = Number(params.conversationId);
  const nextConversationId = Number(formString(formData, "nextConversationId"));
  if (!isPositiveInteger(conversationId)) {
    showErrorToast(ARCHIVE_FAILED_ERROR);
    return { ok: false };
  }

  try {
    await archiveConversation(conversationId);
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    showErrorToast(ARCHIVE_FAILED_ERROR);
    return { ok: false };
  }

  showSuccessToast(ARCHIVED_MESSAGE);
  // Without a next conversation the messages page picks the newest, if any.
  return replace(
    isPositiveInteger(nextConversationId)
      ? conversationPath(nextConversationId)
      : CONVERSATIONS_PATH,
  );
}

// Saves the open conversation's recipient as a contact. The router revalidates
// the page loader afterwards, which marks the recipient as added.
async function addRecipientContactAction({
  request,
}: ActionFunctionArgs): Promise<AddRecipientContactResult | Response> {
  const formData = await request.formData();
  const recipientId = Number(formString(formData, "recipientId"));
  if (!isPositiveInteger(recipientId)) {
    showErrorToast(ADD_CONTACT_FAILED_ERROR);
    return { ok: false };
  }

  try {
    await addContact(recipientId);
    // No success toast: the button turning into "Added to Contacts" says it.
    return { ok: true };
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    showErrorToast(ADD_CONTACT_FAILED_ERROR);
    return { ok: false };
  }
}

export {
  sendMessageAction,
  createConversationAction,
  unarchiveConversationAction,
  archiveConversationAction,
  addRecipientContactAction,
};
export type {
  SendMessageResult,
  CreateConversationResult,
  UnarchiveConversationResult,
  ArchiveConversationResult,
  AddRecipientContactResult,
};
