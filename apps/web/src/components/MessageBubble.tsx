import type { ReactNode } from "react";

interface MessageBubbleProps {
  className: string;
  children: ReactNode;
}

// Keeps the sender's line breaks and wraps long words inside the bubble.
function MessageBubble({ className, children }: MessageBubbleProps) {
  return (
    <p
      className={`rounded-2xl px-4 py-2 text-gray-900 whitespace-pre-wrap wrap-break-word ${className}`}
    >
      {children}
    </p>
  );
}

export default MessageBubble;
