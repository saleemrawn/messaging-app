import type { ReactNode } from "react";

interface MessageBubbleProps {
  className: string;
  children: ReactNode;
}

// Keeps the sender's line breaks and wraps long words inside the bubble.
function MessageBubble({ className, children }: MessageBubbleProps) {
  return (
    <p
      className={`rounded-[14px] px-4.5 py-3 text-sm leading-[1.55] whitespace-pre-wrap wrap-break-word ${className}`}
    >
      {children}
    </p>
  );
}

export default MessageBubble;
