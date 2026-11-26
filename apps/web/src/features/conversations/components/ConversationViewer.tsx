import { useId } from "react";
import type { ConversationDetail } from "../types.ts";
import ConversationHeader from "./ConversationHeader.tsx";
import MessageComposer from "./MessageComposer.tsx";
import MessageList from "./MessageList.tsx";

interface ConversationViewerProps {
  conversation: ConversationDetail;
  currentUserId: number;
  isRecipientContact: boolean;
  // Shown after this conversation is archived; null when it's the only one.
  nextConversationId: number | null;
}

// Keyed by conversation id where it's rendered, so switching conversations
// starts fresh: an empty draft and no earlier archive error.
function ConversationViewer({
  conversation,
  currentUserId,
  isRecipientContact,
  nextConversationId,
}: ConversationViewerProps) {
  const { recipient } = conversation;
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-1 flex-col bg-white"
    >
      <ConversationHeader
        conversationId={conversation.id}
        recipient={recipient}
        headingId={headingId}
        isRecipientContact={isRecipientContact}
        nextConversationId={nextConversationId}
      />
      <MessageList conversation={conversation} currentUserId={currentUserId} />
      <MessageComposer
        recipientId={recipient.id}
        shouldAutoFocus={conversation.messages.length === 0}
      />
    </section>
  );
}

export default ConversationViewer;
