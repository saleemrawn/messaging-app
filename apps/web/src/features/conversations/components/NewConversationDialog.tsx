import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type SubmitEvent,
} from "react";
import { useFetcher, useNavigate } from "react-router";
import { useCurrentUser } from "../../auth/use-current-user.ts";
import type { CreateConversationResult } from "../actions.ts";
import type { RecipientLookupResult } from "../loaders.ts";
import { NEW_CONVERSATION_PATH, conversationPath } from "../paths.ts";
import type { ConversationSummary, Recipient } from "../types.ts";
import FormError from "../../../shared/components/FormError.tsx";
import RecipientOption from "./RecipientOption.tsx";

const LOOKUP_DEBOUNCE_MS = 300;
// Deliberately loose: it only decides when the address looks finished enough
// to look up. The API does the real validation.
const COMPLETE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_MESSAGES = {
  incomplete: "Enter their full email address",
  self: "That's your own email address",
  searching: "Searching…",
  "not-found": "No user found with that email address",
  error: "Couldn't search right now. Please try again.",
} as const;

type LookupStatus = keyof typeof STATUS_MESSAGES | "found";

interface NewConversationDialogProps {
  conversations: ConversationSummary[];
  // Called once the dialog has closed itself (close button, Escape, backdrop).
  // Navigating to a conversation unmounts it without calling this.
  onClose: () => void;
}

function lookupHref(email: string): string {
  return `${NEW_CONVERSATION_PATH}?${new URLSearchParams({ email }).toString()}`;
}

function getLookupStatus(
  email: string,
  ownEmail: string,
  result: RecipientLookupResult | undefined,
): LookupStatus {
  if (!COMPLETE_EMAIL_PATTERN.test(email)) return "incomplete";
  if (email.toLowerCase() === ownEmail.toLowerCase()) return "self";
  // A result for an older input is as good as none.
  if (result?.email !== email) return "searching";
  return result.status;
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
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const lookupFetcher = useFetcher<RecipientLookupResult>();
  const createFetcher = useFetcher<CreateConversationResult>();
  const [inputValue, setInputValue] = useState("");

  const email = inputValue.trim();
  const status = getLookupStatus(email, currentUser.email, lookupFetcher.data);
  const recipient =
    status === "found" && lookupFetcher.data?.status === "found"
      ? lookupFetcher.data.recipient
      : null;
  const existingConversation = recipient
    ? conversations.find(({ recipient: { id } }) => id === recipient.id)
    : undefined;
  const isCreating = createFetcher.state !== "idle";
  const createError = isCreating ? undefined : createFetcher.data?.error;
  const shouldLookUp = status !== "incomplete" && status !== "self";
  const { load } = lookupFetcher;

  // showModal() gives focus containment, an inert page behind and Escape.
  // React's autoFocus doesn't set the attribute showModal() looks for, so the
  // email field is focused explicitly.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
  }, []);

  // Look the address up once typing pauses. The fetcher drops any response
  // superseded by a newer load.
  useEffect(() => {
    if (!shouldLookUp) return;
    const timer = setTimeout(() => {
      void load(lookupHref(email));
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [shouldLookUp, email, load]);

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

  const statusMessage = status === "found" ? "" : STATUS_MESSAGES[status];
  const isStatusError = status === "not-found" || status === "error";

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
