import { useId, useState } from "react";
import type { ConversationSummary } from "../types/api.ts";
import ConversationListItem from "./ConversationListItem.tsx";

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

  return (
    <section className="flex w-96 shrink-0 flex-col border-r border-gray-200 bg-white">
      <h1 className="px-6 pt-6 pb-4 text-2xl font-semibold">Messages</h1>
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
        className="min-h-0 flex-1 overflow-y-auto"
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
