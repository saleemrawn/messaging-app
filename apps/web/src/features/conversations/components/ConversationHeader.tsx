import { useFetcher } from "react-router";
import type { ArchiveConversationResult } from "../actions.ts";
import { archiveConversationPath } from "../paths.ts";
import type { ConversationRecipient } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import FormError from "../../../shared/components/FormError.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ConversationHeaderProps {
  conversationId: number;
  recipient: ConversationRecipient;
  headingId: string;
  // Opened once this conversation is archived; null falls back to the newest.
  nextConversationId: number | null;
}

function ConversationHeader({
  conversationId,
  recipient,
  headingId,
  nextConversationId,
}: ConversationHeaderProps) {
  const fetcher = useFetcher<ArchiveConversationResult>();
  const isArchiving = fetcher.state !== "idle";
  const error = fetcher.data?.ok === false ? fetcher.data.error : undefined;

  return (
    <header className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <UserAvatar
          firstName={recipient.firstName}
          lastName={recipient.lastName}
        />
        <h2
          id={headingId}
          className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-900"
        >
          {formatFullName(recipient)}
        </h2>
        <fetcher.Form
          method="post"
          action={archiveConversationPath(conversationId)}
          className="shrink-0"
        >
          {nextConversationId !== null && (
            <input
              type="hidden"
              name="nextConversationId"
              value={nextConversationId}
            />
          )}
          <button
            type="submit"
            disabled={isArchiving}
            className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {isArchiving ? "Archiving…" : "Archive"}
          </button>
        </fetcher.Form>
      </div>
      <FormError message={error} />
    </header>
  );
}

export default ConversationHeader;
