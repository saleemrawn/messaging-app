import { useId } from "react";
import { useLoaderData } from "react-router";
import { useCurrentUser } from "../../auth/use-current-user.ts";
import ArchivedConversationListItem from "../components/ArchivedConversationListItem.tsx";
import type { ConversationSummary } from "../types.ts";

function ArchivePage() {
  const conversations = useLoaderData<ConversationSummary[]>();
  const currentUser = useCurrentUser();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full w-full flex-col border-line bg-panel xl:max-w-2xl xl:border-r"
    >
      <h1 id={headingId} className="px-6 pt-8 pb-6 font-serif text-[30px] text-ink">
        Archive
      </h1>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted">
            No archived conversations
          </p>
        ) : (
          <ul
            aria-label="Archived conversations"
            className="divide-y divide-line-subtle"
          >
            {conversations.map((conversation) => (
              <ArchivedConversationListItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUser.id}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ArchivePage;
