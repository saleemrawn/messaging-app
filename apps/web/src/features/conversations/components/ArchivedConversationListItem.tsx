import { useFetcher } from "react-router";
import type { UnarchiveConversationResult } from "../actions.ts";
import { ARCHIVE_PATH } from "../paths.ts";
import type { ConversationSummary } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import { formatConversationTimestamp } from "../utils/format-conversation-timestamp.ts";
import { getMessagePreview } from "../utils/message-preview.ts";
import FormError from "../../../shared/components/FormError.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ArchivedConversationListItemProps {
  conversation: ConversationSummary;
  currentUserId: number;
}

// A static row: the archive is only for bringing conversations back, so the
// Unarchive button is its one action.
function ArchivedConversationListItem({
  conversation,
  currentUserId,
}: ArchivedConversationListItemProps) {
  const fetcher = useFetcher<UnarchiveConversationResult>();
  const { id, recipient, latestMessage, updatedAt } = conversation;
  const fullName = formatFullName(recipient);
  const timestamp = latestMessage?.createdAt ?? updatedAt;
  const isUnarchiving = fetcher.state !== "idle";
  const error = fetcher.data?.ok === false ? fetcher.data.error : undefined;
  const previewClassName = latestMessage
    ? "truncate text-sm text-gray-600"
    : "truncate text-sm text-gray-400 italic";

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          firstName={recipient.firstName}
          lastName={recipient.lastName}
          avatarUrl={recipient.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{fullName}</p>
          <p className={previewClassName}>
            {getMessagePreview(conversation, currentUserId)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <time dateTime={timestamp} className="text-xs text-gray-500">
            {formatConversationTimestamp(timestamp)}
          </time>
          <fetcher.Form method="post" action={ARCHIVE_PATH}>
            <input type="hidden" name="conversationId" value={id} />
            <button
              type="submit"
              disabled={isUnarchiving}
              aria-label={`Unarchive conversation with ${fullName}`}
              className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {isUnarchiving ? "Unarchiving…" : "Unarchive"}
            </button>
          </fetcher.Form>
        </div>
      </div>
      <FormError message={error} />
    </li>
  );
}

export default ArchivedConversationListItem;
