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

function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const idPrefix = useId();
  const tabId = (value: ConversationFilter) => `${idPrefix}-tab-${value}`;
  const panelId = `${idPrefix}-panel`;

  const visible =
    filter === "unread"
      ? conversations.filter(({ unreadCount }) => unreadCount > 0)
      : conversations;
  const emptyMessage =
    TABS.find(({ value }) => value === filter)?.emptyMessage ?? "";

  return (
    <section className="mx-auto flex max-w-2xl flex-col p-6">
      <h1 className="mb-4 text-2xl font-semibold">Messages</h1>
      <div role="tablist" className="flex gap-2 border-b border-gray-200">
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
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(filter)}>
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-500">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-gray-100 bg-white">
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
