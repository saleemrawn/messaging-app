import { useId, useState, type UIEvent } from "react";
import type { ContactListResult } from "../loaders.ts";
import type { Recipient } from "../types.ts";
import RecipientOption from "./RecipientOption.tsx";

// The list scrolls past this many rows. Each RecipientOption row is 4rem tall
// (py-2 around a size-12 avatar), so max-h-80 (20rem) shows exactly five.
const MAX_VISIBLE_CONTACTS = 5;
// Slack for sub-pixel scroll positions when checking for the end of the list.
const SCROLL_END_TOLERANCE_PX = 1;

interface SavedContactListProps {
  // Undefined while the contacts are loading.
  result: ContactListResult | undefined;
  hasConversation: (recipientId: number) => boolean;
  pendingRecipientId: number | null;
  onSelect: (recipient: Recipient) => void;
}

function isScrolledToEnd(element: HTMLElement): boolean {
  return (
    element.scrollTop + element.clientHeight >=
    element.scrollHeight - SCROLL_END_TOLERANCE_PX
  );
}

function getStatusMessage(result: ContactListResult | undefined): string {
  if (!result) return "Loading contacts…";
  if (!result.ok) return "Couldn't load your contacts";
  return result.contacts.length === 0 ? "No saved contacts yet" : "";
}

// The caller's saved contacts as pickable rows, capped at five visible rows.
// A blurred fade over the bottom edge shows there are more below.
function SavedContactList({
  result,
  hasConversation,
  pendingRecipientId,
  onSelect,
}: SavedContactListProps) {
  const headingId = useId();
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const contacts = result?.ok ? result.contacts : [];
  const statusMessage = getStatusMessage(result);
  const showFade = contacts.length > MAX_VISIBLE_CONTACTS && !hasReachedEnd;

  function handleScroll(event: UIEvent<HTMLUListElement>) {
    setHasReachedEnd(isScrolledToEnd(event.currentTarget));
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="text-sm font-medium">
        Contacts
      </h3>
      {statusMessage ? (
        <p className="text-sm text-muted">{statusMessage}</p>
      ) : (
        <div className="relative">
          <ul
            aria-labelledby={headingId}
            onScroll={handleScroll}
            className="max-h-80 overflow-y-auto"
          >
            {contacts.map((contact) => (
              <RecipientOption
                key={contact.id}
                recipient={contact}
                hasConversation={hasConversation(contact.id)}
                isPending={pendingRecipientId === contact.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
          {showFade && (
            <div
              aria-hidden="true"
              data-testid="contacts-scroll-fade"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white to-white/0 backdrop-blur-[2px] mask-t-from-0%"
            />
          )}
        </div>
      )}
    </section>
  );
}

export default SavedContactList;
