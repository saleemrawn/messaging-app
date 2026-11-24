import type { ConversationMessage } from "../types.ts";
import { formatMessageTimestamp } from "../utils/format-message-timestamp.ts";
import MessageBubble from "./MessageBubble.tsx";

interface SentMessageProps {
  message: ConversationMessage;
}

// The logged-in user's message, right-aligned, with a Read indicator once the
// recipient has opened the conversation.
function SentMessage({ message }: SentMessageProps) {
  const isRead = message.readAt !== null;

  return (
    <li className="flex max-w-[70%] flex-col items-end gap-1 self-end">
      <span className="sr-only">You: </span>
      <MessageBubble className="bg-gray-200">{message.content}</MessageBubble>
      <p className="flex gap-1 text-xs text-gray-500">
        <time dateTime={message.createdAt}>
          {formatMessageTimestamp(message.createdAt)}
        </time>
        {isRead && (
          <>
            <span aria-hidden="true">·</span>
            <span>Read</span>
          </>
        )}
      </p>
    </li>
  );
}

export default SentMessage;
