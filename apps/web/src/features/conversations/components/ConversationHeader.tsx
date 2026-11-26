import { Archive, ChevronLeft, UserCheck, UserPlus } from "lucide-react";
import { Link, useFetcher } from "react-router";
import type {
  AddRecipientContactResult,
  ArchiveConversationResult,
} from "../actions.ts";
import {
  CONVERSATIONS_PATH,
  addRecipientContactPath,
  archiveConversationPath,
} from "../paths.ts";
import { useIsSplitView } from "../split-view.ts";
import type { ConversationDetailRecipient } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import FormError from "../../../shared/components/FormError.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ConversationHeaderProps {
  conversationId: number;
  recipient: ConversationDetailRecipient;
  headingId: string;
  isRecipientContact: boolean;
  // Opened once this conversation is archived in split view; null, or
  // single-column view, falls back to /conversations.
  nextConversationId: number | null;
}

// Below sm the buttons show only an icon; the label stays for screen readers.
const HEADER_BUTTON_CLASS =
  "flex items-center rounded border border-gray-300 p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 sm:px-3 sm:py-1";
const HEADER_ICON_CLASS = "size-4 sm:hidden";
const HEADER_LABEL_CLASS = "max-sm:sr-only";

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
  const isSplit = useIsSplitView();
  // Single-column view returns to the list after archiving, not the next one.
  const archiveNextId = isSplit ? nextConversationId : null;
  const fetcher = useFetcher<ArchiveConversationResult>();
  const contactFetcher = useFetcher<AddRecipientContactResult>();
  const isArchiving = fetcher.state !== "idle";
  const isAddingContact = contactFetcher.state !== "idle";
  // Either button's failure; a retry clears its own. If both failed, the add
  // contact error shows.
  const error =
    getErrorMessage(contactFetcher.data) ?? getErrorMessage(fetcher.data);
  const ContactIcon = isRecipientContact ? UserCheck : UserPlus;

  return (
    <header className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        {!isSplit && (
          <Link
            to={CONVERSATIONS_PATH}
            aria-label="Back to conversations"
            className="-ml-2 shrink-0 rounded p-1 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronLeft aria-hidden="true" strokeWidth={1.5} />
          </Link>
        )}
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
            <ContactIcon aria-hidden="true" className={HEADER_ICON_CLASS} />
            <span className={HEADER_LABEL_CLASS}>
              {getAddContactLabel(isRecipientContact, isAddingContact)}
            </span>
          </button>
        </contactFetcher.Form>
        <fetcher.Form
          method="post"
          action={archiveConversationPath(conversationId)}
          className="shrink-0"
        >
          {archiveNextId !== null && (
            <input
              type="hidden"
              name="nextConversationId"
              value={archiveNextId}
            />
          )}
          <button
            type="submit"
            disabled={isArchiving}
            className={HEADER_BUTTON_CLASS}
          >
            <Archive aria-hidden="true" className={HEADER_ICON_CLASS} />
            <span className={HEADER_LABEL_CLASS}>
              {isArchiving ? "Archiving…" : "Archive"}
            </span>
          </button>
        </fetcher.Form>
      </div>
      <FormError message={error} />
    </header>
  );
}

export default ConversationHeader;
