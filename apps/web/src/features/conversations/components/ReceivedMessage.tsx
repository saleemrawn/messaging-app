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
      <UserAvatar firstName={sender.firstName} lastName={sender.lastName} />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <p className="text-sm font-semibold text-gray-900">
          {formatFullName(sender)}
        </p>
        <MessageBubble className="bg-gray-100">{message.content}</MessageBubble>
        <time dateTime={message.createdAt} className="text-xs text-gray-500">
          {formatMessageTimestamp(message.createdAt)}
        </time>
      </div>
    </li>
  );
}

export default ReceivedMessage;
