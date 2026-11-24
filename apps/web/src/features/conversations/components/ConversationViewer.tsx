import { useId } from "react";
import type { ConversationDetail } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import MessageComposer from "./MessageComposer.tsx";
import MessageList from "./MessageList.tsx";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ConversationViewerProps {
  conversation: ConversationDetail;
  currentUserId: number;
}

function ConversationViewer({
  conversation,
  currentUserId,
}: ConversationViewerProps) {
  const { recipient } = conversation;
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-1 flex-col bg-white"
    >
      <header className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
        <UserAvatar
          firstName={recipient.firstName}
          lastName={recipient.lastName}
        />
        <h2 id={headingId} className="truncate text-lg font-semibold text-gray-900">
          {formatFullName(recipient)}
        </h2>
      </header>
      <MessageList conversation={conversation} currentUserId={currentUserId} />
      <MessageComposer key={conversation.id} recipientId={recipient.id} />
    </section>
  );
}

export default ConversationViewer;
