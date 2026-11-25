import type { ConversationSummary } from "../types.ts";

const EMPTY_PREVIEW = "No messages yet";

// The latest message, attributed to "You" or the other participant's first
// name, for a one-line conversation preview.
function getMessagePreview(
  { latestMessage, recipient }: ConversationSummary,
  currentUserId: number,
): string {
  if (!latestMessage) return EMPTY_PREVIEW;

  const author =
    latestMessage.senderId === currentUserId ? "You" : recipient.firstName;
  return `${author}: ${latestMessage.content}`;
}

export { getMessagePreview };
