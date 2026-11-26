import {
  useId,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type SubmitEvent,
} from "react";
import { useFetcher, useNavigate } from "react-router";
import type { CreateConversationResult } from "../actions.ts";
import { NEW_CONVERSATION_PATH, conversationPath } from "../paths.ts";
import type { ConversationSummary, Recipient } from "../types.ts";
import { useEmailLookup } from "../../users/use-email-lookup.ts";
import FormError from "../../../shared/components/FormError.tsx";
import RecipientOption from "./RecipientOption.tsx";

interface NewConversationDialogProps {
  conversations: ConversationSummary[];
  // Called once the dialog has closed itself (close button, Escape, backdrop).
  // Navigating to a conversation unmounts it without calling this.
  onClose: () => void;
}

function NewConversationDialog({
  conversations,
  onClose,
}: NewConversationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const statusId = useId();
  const navigate = useNavigate();
  const createFetcher = useFetcher<CreateConversationResult>();
  const {
    inputValue,
    setInputValue,
    user: recipient,
    statusMessage,
    isStatusError,
  } = useEmailLookup(NEW_CONVERSATION_PATH);

  const existingConversation = recipient
    ? conversations.find(({ recipient: { id } }) => id === recipient.id)
    : undefined;
  const isCreating = createFetcher.state !== "idle";
  const createError = isCreating ? undefined : createFetcher.data?.error;

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

  function selectRecipient(selected: Recipient) {
    if (isCreating) return;
    if (existingConversation) {
      void navigate(conversationPath(existingConversation.id));
      return;
    }
    void createFetcher.submit(
      { recipientId: String(selected.id) },
      { method: "post", action: NEW_CONVERSATION_PATH },
    );
  }

  // Enter in the email field picks the result, when there is one.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recipient) selectRecipient(recipient);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      <div className="flex flex-col gap-4 p-6">
        <header className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            New conversation
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={closeDialog}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-5"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            To
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

        {recipient && (
          <ul aria-label="Search results">
            <RecipientOption
              recipient={recipient}
              hasConversation={existingConversation !== undefined}
              isPending={isCreating}
              onSelect={selectRecipient}
            />
          </ul>
        )}

        <FormError message={createError} />
      </div>
    </dialog>
  );
}

export default NewConversationDialog;
