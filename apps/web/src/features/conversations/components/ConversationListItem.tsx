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

// A hairline from the text column to the row's right edge, between rows.
// Hidden next to the selected row, whose tint already separates it.
const ROW_DIVIDER_CLASS =
  "not-first:before:absolute not-first:before:top-0 not-first:before:right-3 not-first:before:left-17 not-first:before:h-px not-first:before:bg-line-subtle has-[[aria-current=page]]:before:hidden [li:has([aria-current=page])+&]:before:hidden";

function rowClassName({ isActive }: { isActive: boolean }): string {
  const base =
    "flex items-start gap-3 rounded-[10px] px-3 py-5 focus-visible:outline-2 focus-visible:outline-brand";
  return isActive ? `${base} bg-tint` : `${base} hover:bg-tint/50`;
}

// Secondary text turns brand green on the selected row.
function metaColor(isActive: boolean): string {
  return isActive ? "text-brand" : "text-muted";
}

function ConversationListItem({
  conversation,
  currentUserId,
}: ConversationListItemProps) {
  const { id, recipient, updatedAt, unreadCount } = conversation;
  const fullName = formatFullName(recipient);
  const nameWeight = unreadCount > 0 ? "font-semibold" : "font-medium";
  const previewStyle = conversation.latestMessage ? "" : "italic";

  return (
    <li className={`relative ${ROW_DIVIDER_CLASS}`}>
      <NavLink to={conversationPath(id)} className={rowClassName}>
        {({ isActive }) => (
          <>
            <UserAvatar
              firstName={recipient.firstName}
              lastName={recipient.lastName}
              avatarUrl={recipient.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[13px] text-ink ${nameWeight}`}>
                {fullName}
              </p>
              <p
                className={`truncate text-xs ${metaColor(isActive)} ${previewStyle}`}
              >
                {getMessagePreview(conversation, currentUserId)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <time
                dateTime={updatedAt}
                className={`text-[10px] ${metaColor(isActive)}`}
              >
                {formatConversationTimestamp(updatedAt)}
              </time>
              <UnreadBadge count={unreadCount} />
            </div>
          </>
        )}
      </NavLink>
    </li>
  );
}

export default ConversationListItem;
