import { useLayoutEffect, useRef } from "react";
import type { ConversationDetail } from "../types.ts";
import ReceivedMessage from "./ReceivedMessage.tsx";
import SentMessage from "./SentMessage.tsx";

interface MessageListProps {
  conversation: ConversationDetail;
  currentUserId: number;
}

function MessageList({ conversation, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { id, messages, recipient } = conversation;
  const messageCount = messages.length;

  // Pin to the newest message when a conversation opens or a message arrives
  // (today only the user's own sends add messages; revisit if polling lands).
  // Layout effect so the user never sees the list at the top first.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || messageCount === 0) return;
    element.scrollTop = element.scrollHeight;
  }, [id, messageCount]);

  return (
    // role="log" announces new messages politely; tabIndex lets keyboard
    // users scroll the history.
    <div
      ref={scrollRef}
      role="log"
      aria-label="Messages"
      tabIndex={0}
      className="relative min-h-0 flex-1 overflow-y-auto px-6 py-4 focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {messageCount === 0 ? (
        <p className="py-8 text-center text-gray-500">
          No messages yet. Say hello to {recipient.firstName}!
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {messages.map((message) =>
            message.senderId === currentUserId ? (
              <SentMessage key={message.id} message={message} />
            ) : (
              <ReceivedMessage
                key={message.id}
                message={message}
                sender={recipient}
              />
            ),
          )}
        </ol>
      )}
    </div>
  );
}

export default MessageList;
