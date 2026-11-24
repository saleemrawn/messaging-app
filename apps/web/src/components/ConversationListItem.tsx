import type { ConversationSummary } from "../types/api.ts";
import { formatConversationTimestamp } from "../utils/format-conversation-timestamp.ts";
import UnreadBadge from "./UnreadBadge.tsx";
import UserAvatar from "./UserAvatar.tsx";

interface ConversationListItemProps {
  conversation: ConversationSummary;
  currentUserId: number;
}

function getMessagePreview(
  { latestMessage, recipient }: ConversationSummary,
  currentUserId: number,
): string {
  if (!latestMessage) return "";

  const author =
    latestMessage.senderId === currentUserId ? "You" : recipient.firstName;
  return `${author}: ${latestMessage.content}`;
}

function ConversationListItem({
  conversation,
  currentUserId,
}: ConversationListItemProps) {
  const { recipient, updatedAt, unreadCount } = conversation;
  const fullName = `${recipient.firstName} ${recipient.lastName}`;

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <UserAvatar
        firstName={recipient.firstName}
        lastName={recipient.lastName}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{fullName}</p>
        <p className="truncate text-sm text-gray-600">
          {getMessagePreview(conversation, currentUserId)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <time dateTime={updatedAt} className="text-xs text-gray-500">
          {formatConversationTimestamp(updatedAt)}
        </time>
        <UnreadBadge count={unreadCount} />
      </div>
    </li>
  );
}

export default ConversationListItem;
