import { Archive, ChevronLeft, UserCheck, UserPlus } from "lucide-react";
import { Link, useFetcher } from "react-router";
import {
  CONVERSATIONS_PATH,
  addRecipientContactPath,
  archiveConversationPath,
} from "../paths.ts";
import { useIsSplitView } from "../split-view.ts";
import type { ConversationDetailRecipient } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
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
  "flex items-center rounded-lg border border-line p-2 text-sm font-medium text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 sm:px-3 sm:py-1.5";
const HEADER_ICON_CLASS = "size-4 sm:hidden";
const HEADER_LABEL_CLASS = "max-sm:sr-only";

function getAddContactLabel(isContact: boolean, isAdding: boolean): string {
  if (isContact) return "Added to Contacts";
  return isAdding ? "Adding…" : "Add contact";
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
  // Both actions report their outcome with a toast.
  const fetcher = useFetcher();
  const contactFetcher = useFetcher();
  const isArchiving = fetcher.state !== "idle";
  const isAddingContact = contactFetcher.state !== "idle";
  const ContactIcon = isRecipientContact ? UserCheck : UserPlus;

  return (
    <header className="flex flex-col gap-3 border-b border-line px-4 py-5 sm:px-8 sm:py-7">
      <div className="flex items-center gap-3">
        {!isSplit && (
          <Link
            to={CONVERSATIONS_PATH}
            aria-label="Back to conversations"
            className="-ml-2 shrink-0 rounded-lg p-1 text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-brand"
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
            className="truncate font-serif text-[22px] text-ink"
          >
            {formatFullName(recipient)}
          </h2>
          <p className="truncate text-xs text-muted">{recipient.email}</p>
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
    </header>
  );
}

export default ConversationHeader;
