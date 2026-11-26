import { useId, useRef, useState } from "react";
import { useLocation } from "react-router";
import { SquarePen } from "lucide-react";
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
  // A fixed-width column beside the viewer, or the whole screen on its own.
  isSplitView: boolean;
}

function tabClassName(isSelected: boolean): string {
  const base =
    "h-8 rounded-[7px] px-3.5 text-xs focus-visible:outline-2 focus-visible:outline-brand";
  return isSelected
    ? `${base} bg-tint font-medium text-brand`
    : `${base} text-muted hover:text-ink`;
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
  isSplitView,
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
    <section
      className={`flex flex-col bg-panel ${isSplitView ? "w-90 shrink-0 border-r border-line" : "w-full"}`}
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-8 pb-6 sm:px-6">
        <h1 className="font-serif text-[30px] text-ink">Messages</h1>
        <button
          ref={newConversationButtonRef}
          type="button"
          aria-label="New conversation"
          aria-haspopup="dialog"
          onClick={() => {
            setDialogLocationKey(locationKey);
          }}
          className="flex size-10 items-center justify-center rounded-[10px] bg-brand text-white hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <SquarePen aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      {isDialogOpen && (
        <NewConversationDialog
          conversations={conversations}
          onClose={closeDialog}
        />
      )}
      <div role="tablist" className="flex gap-2 px-4 pb-4 sm:px-6">
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
          <p className="px-4 py-8 text-center text-sm text-muted">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col px-3 pb-3">
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
