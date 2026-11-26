import {
  useId,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type SubmitEvent,
} from "react";
import { useFetcher } from "react-router";
import { X } from "lucide-react";
import type { AddContactResult } from "../actions.ts";
import { ADD_CONTACT_PATH } from "../paths.ts";
import type { Contact } from "../types.ts";
import type { UserSummary } from "../../users/types.ts";
import { useEmailLookup } from "../../users/use-email-lookup.ts";
import FormError from "../../../shared/components/FormError.tsx";
import ContactOption from "./ContactOption.tsx";

interface AddContactDialogProps {
  contacts: Contact[];
  // Called once the dialog has closed itself (close button, Escape, backdrop).
  // Adding a contact navigates, which unmounts it without calling this.
  onClose: () => void;
}

function AddContactDialog({ contacts, onClose }: AddContactDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const statusId = useId();
  const addFetcher = useFetcher<AddContactResult>();
  const { inputValue, setInputValue, user, statusMessage, isStatusError } =
    useEmailLookup(ADD_CONTACT_PATH);

  const isContact =
    user !== null && contacts.some(({ id }) => id === user.id);
  const isAdding = addFetcher.state !== "idle";
  const addError = isAdding ? undefined : addFetcher.data?.error;

  // showModal() gives focus containment, an inert page behind and Escape.
  // React's autoFocus doesn't set the attribute showModal() looks for, so the
  // email field is focused explicitly.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // Clicks inside the panel target its children; only the backdrop hits
    // the dialog element itself.
    if (event.target === dialogRef.current) closeDialog();
  }

  function addUser(selected: UserSummary) {
    if (isAdding || isContact) return;
    void addFetcher.submit(
      { contactId: String(selected.id) },
      { method: "post", action: ADD_CONTACT_PATH },
    );
  }

  // Enter in the email field adds the result, when there is one.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (user) addUser(user);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Add contact
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={closeDialog}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            Email
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            name="email"
            autoComplete="off"
            placeholder="name@example.com"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
            }}
            aria-describedby={statusId}
            className="rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <p
            id={statusId}
            aria-live="polite"
            className={`min-h-5 text-sm ${isStatusError ? "text-red-600" : "text-gray-500"}`}
          >
            {statusMessage}
          </p>
        </form>

        {user && (
          <ul aria-label="Search results">
            <ContactOption
              user={user}
              isContact={isContact}
              isPending={isAdding}
              onSelect={addUser}
            />
          </ul>
        )}

        <FormError message={addError} />
      </div>
    </dialog>
  );
}

export default AddContactDialog;
