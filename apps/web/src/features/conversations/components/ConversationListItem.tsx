import { NavLink } from "react-router";
import { conversationPath } from "../paths.ts";
import type { ConversationSummary } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import { formatConversationTimestamp } from "../utils/format-conversation-timestamp.ts";
import { getMessagePreview } from "../utils/message-preview.ts";
import UnreadBadge from "./UnreadBadge.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ConversationListItemProps {
  conversation: ConversationSummary;
  currentUserId: number;
}

function rowClassName({ isActive }: { isActive: boolean }): string {
  const base = "flex items-start gap-3 px-4 py-3";
  return isActive ? `${base} bg-blue-50` : `${base} hover:bg-gray-50`;
}

function ConversationListItem({
  conversation,
  currentUserId,
}: ConversationListItemProps) {
  const { id, recipient, updatedAt, unreadCount } = conversation;
  const fullName = formatFullName(recipient);
  const previewClassName = conversation.latestMessage
    ? "truncate text-sm text-gray-600"
    : "truncate text-sm text-gray-400 italic";

  return (
    <li>
      <NavLink to={conversationPath(id)} className={rowClassName}>
        <UserAvatar
          firstName={recipient.firstName}
          lastName={recipient.lastName}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{fullName}</p>
          <p className={previewClassName}>
            {getMessagePreview(conversation, currentUserId)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <time dateTime={updatedAt} className="text-xs text-gray-500">
            {formatConversationTimestamp(updatedAt)}
          </time>
          <UnreadBadge count={unreadCount} />
        </div>
      </NavLink>
    </li>
  );
}

export default ConversationListItem;
