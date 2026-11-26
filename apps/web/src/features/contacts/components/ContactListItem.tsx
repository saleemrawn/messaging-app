import { useFetcher } from "react-router";
import type { RemoveContactResult } from "../actions.ts";
import { CONTACTS_PATH } from "../paths.ts";
import type { Contact } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import FormError from "../../../shared/components/FormError.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ContactListItemProps {
  contact: Contact;
}

function ContactListItem({ contact }: ContactListItemProps) {
  const fetcher = useFetcher<RemoveContactResult>();
  const fullName = formatFullName(contact);
  const isRemoving = fetcher.state !== "idle";
  const error = fetcher.data?.ok === false ? fetcher.data.error : undefined;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar firstName={contact.firstName} lastName={contact.lastName} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{fullName}</p>
          <p className="truncate text-sm text-gray-600">{contact.email}</p>
        </div>
        <fetcher.Form method="post" action={CONTACTS_PATH}>
          <input type="hidden" name="contactId" value={contact.id} />
          <button
            type="submit"
            disabled={isRemoving}
            aria-label={`Remove ${fullName} from contacts`}
            className="shrink-0 rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        </fetcher.Form>
      </div>
      <FormError message={error} />
    </li>
  );
}

export default ContactListItem;
