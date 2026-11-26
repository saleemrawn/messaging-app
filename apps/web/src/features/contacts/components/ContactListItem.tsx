import { useFetcher } from "react-router";
import type { RemoveContactResult } from "../actions.ts";
import { CONTACTS_PATH } from "../paths.ts";
import type { Contact } from "../types.ts";
import type { CreateConversationResult } from "../../conversations/actions.ts";
import { NEW_CONVERSATION_PATH } from "../../conversations/paths.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import FormError from "../../../shared/components/FormError.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ContactListItemProps {
  contact: Contact;
}

const BUTTON_BASE_CLASSES =
  "rounded px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50";

function ContactListItem({ contact }: ContactListItemProps) {
  // Message posts to the create conversation action, which reuses an existing
  // conversation with the contact and redirects to it on the Messages page.
  const messageFetcher = useFetcher<CreateConversationResult>();
  const removeFetcher = useFetcher<RemoveContactResult>();
  const fullName = formatFullName(contact);
  const isOpening = messageFetcher.state !== "idle";
  const isRemoving = removeFetcher.state !== "idle";
  const isBusy = isOpening || isRemoving;
  const messageError = isOpening ? undefined : messageFetcher.data?.error;
  const removeError =
    removeFetcher.data?.ok === false ? removeFetcher.data.error : undefined;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          avatarUrl={contact.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{fullName}</p>
          <p className="truncate text-sm text-gray-600">{contact.email}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <messageFetcher.Form method="post" action={NEW_CONVERSATION_PATH}>
            <input type="hidden" name="recipientId" value={contact.id} />
            <button
              type="submit"
              disabled={isBusy}
              aria-label={`Message ${fullName}`}
              className={`${BUTTON_BASE_CLASSES} bg-blue-600 text-white hover:bg-blue-700`}
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
              className={`${BUTTON_BASE_CLASSES} border border-gray-300 text-gray-700 hover:bg-gray-100`}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          </removeFetcher.Form>
        </div>
      </div>
      <FormError message={messageError ?? removeError} />
    </li>
  );
}

export default ContactListItem;
