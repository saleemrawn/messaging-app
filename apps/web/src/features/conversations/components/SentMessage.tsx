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
    <li className="flex max-w-[70%] flex-col items-end gap-1.5 self-end">
      <span className="sr-only">You: </span>
      <MessageBubble className="rounded-tr-[4px] bg-brand text-white">{message.content}</MessageBubble>
      <p className="flex gap-1 px-2 text-[11px] text-muted">
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
