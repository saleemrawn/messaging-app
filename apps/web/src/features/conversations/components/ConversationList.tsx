import { useId, useRef, useState } from "react";
import { useLocation } from "react-router";
import type { ConversationSummary } from "../types.ts";
import ConversationListItem from "./ConversationListItem.tsx";
import NewConversationDialog from "./NewConversationDialog.tsx";

type ConversationFilter = "all" | "unread";

const TABS: readonly {
  value: ConversationFilter;
  label: string;
  emptyMessage: string;
}[] = [
  { value: "all", label: "All messages", emptyMessage: "No conversations yet" },
  { value: "unread", label: "Unread", emptyMessage: "No unread conversations" },
];

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentUserId: number;
}

function tabClassName(isSelected: boolean): string {
  const base = "border-b-2 px-3 py-2 text-sm font-medium";
  return isSelected
    ? `${base} border-blue-600 text-blue-700`
    : `${base} border-transparent text-gray-600 hover:text-gray-900`;
}

function getUnreadIds(conversations: ConversationSummary[]): Set<number> {
  return new Set(
    conversations
      .filter(({ unreadCount }) => unreadCount > 0)
      .map(({ id }) => id),
  );
}

function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  const [filter, setFilter] = useState<ConversationFilter>("all");
  // Conversations that were unread when the Unread tab was opened stay listed
  // while it is open, so reading one doesn't pull it out from under the user.
  const [unreadOnOpen, setUnreadOnOpen] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const { key: locationKey } = useLocation();
  // The location the dialog was opened at. Any navigation, including opening
  // the conversation already on screen, gets a new key and closes the dialog.
  const [dialogLocationKey, setDialogLocationKey] = useState<string | null>(
    null,
  );
  if (dialogLocationKey !== null && dialogLocationKey !== locationKey) {
    setDialogLocationKey(null);
  }
  const isDialogOpen = dialogLocationKey === locationKey;
  const newConversationButtonRef = useRef<HTMLButtonElement>(null);
  const idPrefix = useId();
  const tabId = (value: ConversationFilter) => `${idPrefix}-tab-${value}`;
  const panelId = `${idPrefix}-panel`;

  const visible =
    filter === "unread"
      ? conversations.filter(
          ({ id, unreadCount }) => unreadCount > 0 || unreadOnOpen.has(id),
        )
      : conversations;
  const emptyMessage =
    TABS.find(({ value }) => value === filter)?.emptyMessage ?? "";

  function closeDialog() {
    setDialogLocationKey(null);
    newConversationButtonRef.current?.focus();
  }

  return (
    <section className="flex w-96 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <button
          ref={newConversationButtonRef}
          type="button"
          aria-label="New conversation"
          aria-haspopup="dialog"
          onClick={() => {
            setDialogLocationKey(locationKey);
          }}
          className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
            <path d="M10 4v12M4 10h12" />
          </svg>
        </button>
      </div>
      {isDialogOpen && (
        <NewConversationDialog
          conversations={conversations}
          onClose={closeDialog}
        />
      )}
      <div role="tablist" className="flex gap-2 border-b border-gray-200 px-4">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            id={tabId(value)}
            type="button"
            role="tab"
            aria-selected={filter === value}
            aria-controls={panelId}
            className={tabClassName(filter === value)}
            onClick={() => {
              setFilter(value);
              setUnreadOnOpen(getUnreadIds(conversations));
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(filter)}
        className="relative min-h-0 flex-1 overflow-y-auto"
      >
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-500">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ConversationList;
