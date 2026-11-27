import { useEffect } from "react";
import { useFetcher } from "react-router";
import { CONTACTS_PATH } from "../paths.ts";
import type { Contact } from "../types.ts";
import type { CreateConversationResult } from "../../conversations/actions.ts";
import { NEW_CONVERSATION_PATH } from "../../conversations/paths.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import { showErrorToast } from "../../../shared/utils/toast.ts";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ContactListItemProps {
  contact: Contact;
}

const BUTTON_BASE_CLASSES =
  "rounded-lg px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";

function ContactListItem({ contact }: ContactListItemProps) {
  // Message posts to the create conversation action, which reuses an existing
  // conversation with the contact and redirects to it on the Messages page.
  const messageFetcher = useFetcher<CreateConversationResult>();
  // The remove action reports its outcome with a toast itself, because the
  // row unmounts as soon as the removal succeeds.
  const removeFetcher = useFetcher();
  const fullName = formatFullName(contact);
  const isOpening = messageFetcher.state !== "idle";
  const isRemoving = removeFetcher.state !== "idle";
  const isBusy = isOpening || isRemoving;
  const messageResult = messageFetcher.data;

  // The create conversation action returns its error rather than showing a
  // toast, because the new conversation dialog shows it inline. Success
  // redirects, so data only ever holds a failure; each attempt delivers a new
  // object, so a repeated failure toasts again.
  useEffect(() => {
    if (messageResult) showErrorToast(messageResult.error);
  }, [messageResult]);

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          avatarUrl={contact.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{fullName}</p>
          <p className="truncate text-sm text-muted">{contact.email}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <messageFetcher.Form method="post" action={NEW_CONVERSATION_PATH}>
            <input type="hidden" name="recipientId" value={contact.id} />
            <button
              type="submit"
              disabled={isBusy}
              aria-label={`Message ${fullName}`}
              className={`${BUTTON_BASE_CLASSES} bg-brand text-white hover:bg-brand-strong`}
            >
              {isOpening ? "Opening…" : "Message"}
            </button>
          </messageFetcher.Form>
          <removeFetcher.Form method="post" action={CONTACTS_PATH}>
            <input type="hidden" name="contactId" value={contact.id} />
            <button
              type="submit"
              disabled={isBusy}
              aria-label={`Remove ${fullName} from contacts`}
              className={`${BUTTON_BASE_CLASSES} border border-line-strong text-ink hover:bg-tint/60`}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          </removeFetcher.Form>
        </div>
      </div>
    </li>
  );
}

export default ContactListItem;
