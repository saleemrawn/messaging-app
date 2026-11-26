import { useId, useRef, useState } from "react";
import { useLoaderData, useLocation } from "react-router";
import { Plus } from "lucide-react";
import AddContactDialog from "../components/AddContactDialog.tsx";
import ContactListItem from "../components/ContactListItem.tsx";
import type { Contact } from "../types.ts";

function ContactsPage() {
  const contacts = useLoaderData<Contact[]>();
  const headingId = useId();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { key: locationKey } = useLocation();
  // The location the dialog was opened at. Adding a contact navigates, which
  // gives the location a new key and closes the dialog.
  const [dialogLocationKey, setDialogLocationKey] = useState<string | null>(
    null,
  );
  if (dialogLocationKey !== null && dialogLocationKey !== locationKey) {
    setDialogLocationKey(null);
  }
  const isDialogOpen = dialogLocationKey === locationKey;

  function closeDialog() {
    setDialogLocationKey(null);
    addButtonRef.current?.focus();
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full w-full flex-col border-gray-200 bg-white xl:max-w-2xl xl:border-r"
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
        <h1 id={headingId} className="text-2xl font-semibold">
          Contacts
        </h1>
        <button
          ref={addButtonRef}
          type="button"
          aria-label="Add contact"
          aria-haspopup="dialog"
          onClick={() => {
            setDialogLocationKey(locationKey);
          }}
          className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>
      {isDialogOpen && (
        <AddContactDialog contacts={contacts} onClose={closeDialog} />
      )}
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-200">
        {contacts.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-500">No contacts yet</p>
        ) : (
          <ul aria-label="Contacts" className="divide-y divide-gray-100">
            {contacts.map((contact) => (
              <ContactListItem key={contact.id} contact={contact} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ContactsPage;
