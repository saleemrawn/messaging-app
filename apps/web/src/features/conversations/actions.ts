import { redirect, type ActionFunctionArgs } from "react-router";
import {
  isUnauthorizedError,
  parseApiError,
} from "../../shared/api/api-errors.ts";
import { sendMessage } from "./conversation-service.ts";

const EMPTY_MESSAGE_ERROR = "Message can't be empty";
const SEND_FAILED_ERROR = "Couldn't send your message. Please try again.";

type SendMessageResult = { ok: true } | { ok: false; error: string };

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

export { sendMessageAction };
export type { SendMessageResult };
