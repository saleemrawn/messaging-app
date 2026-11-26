import { useFetcher } from "react-router";
import type {
  AddRecipientContactResult,
  ArchiveConversationResult,
} from "../actions.ts";
import { addRecipientContactPath, archiveConversationPath } from "../paths.ts";
import type { ConversationDetailRecipient } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import FormError from "../../../shared/components/FormError.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ConversationHeaderProps {
  conversationId: number;
  recipient: ConversationDetailRecipient;
  headingId: string;
  isRecipientContact: boolean;
  // Opened once this conversation is archived; null falls back to the newest.
  nextConversationId: number | null;
}

const HEADER_BUTTON_CLASS =
  "rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50";

function getAddContactLabel(isContact: boolean, isAdding: boolean): string {
  if (isContact) return "Added to Contacts";
  return isAdding ? "Adding…" : "Add contact";
}

function getErrorMessage(
  result: AddRecipientContactResult | undefined,
): string | undefined {
  return result?.ok === false ? result.error : undefined;
}

function ConversationHeader({
  conversationId,
  recipient,
  headingId,
  isRecipientContact,
  nextConversationId,
}: ConversationHeaderProps) {
  const fetcher = useFetcher<ArchiveConversationResult>();
  const contactFetcher = useFetcher<AddRecipientContactResult>();
  const isArchiving = fetcher.state !== "idle";
  const isAddingContact = contactFetcher.state !== "idle";
  // Either button's failure; a retry clears its own. If both failed, the add
  // contact error shows.
  const error =
    getErrorMessage(contactFetcher.data) ?? getErrorMessage(fetcher.data);

  return (
    <header className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <UserAvatar
          firstName={recipient.firstName}
          lastName={recipient.lastName}
          avatarUrl={recipient.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <h2
            id={headingId}
            className="truncate text-lg font-semibold text-gray-900"
          >
            {formatFullName(recipient)}
          </h2>
          <p className="truncate text-sm text-gray-600">{recipient.email}</p>
        </div>
        <contactFetcher.Form
          method="post"
          action={addRecipientContactPath(conversationId)}
          className="shrink-0"
        >
          <input type="hidden" name="recipientId" value={recipient.id} />
          <button
            type="submit"
            disabled={isRecipientContact || isAddingContact}
            className={HEADER_BUTTON_CLASS}
          >
            {getAddContactLabel(isRecipientContact, isAddingContact)}
          </button>
        </contactFetcher.Form>
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
            className={HEADER_BUTTON_CLASS}
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
