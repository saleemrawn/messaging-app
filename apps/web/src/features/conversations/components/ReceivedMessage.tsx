import type {
  ConversationMessage,
  ConversationRecipient,
} from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import { formatMessageTimestamp } from "../utils/format-message-timestamp.ts";
import MessageBubble from "./MessageBubble.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ReceivedMessageProps {
  message: ConversationMessage;
  sender: ConversationRecipient;
}

// The other participant's message: avatar on the left, then name, bubble, time.
function ReceivedMessage({ message, sender }: ReceivedMessageProps) {
  return (
    <li className="flex max-w-[70%] items-start gap-3 self-start">
      <UserAvatar
        firstName={sender.firstName}
        lastName={sender.lastName}
        avatarUrl={sender.avatarUrl}
      />
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <p className="px-2 text-[11px] text-muted">
          {formatFullName(sender)}
        </p>
        <MessageBubble className="rounded-tl-[4px] bg-bubble text-ink">{message.content}</MessageBubble>
        <time dateTime={message.createdAt} className="px-2 text-[11px] text-muted">
          {formatMessageTimestamp(message.createdAt)}
        </time>
      </div>
    </li>
  );
}

export default ReceivedMessage;
