import { matchPath } from "react-router";
import { CONVERSATION_PATH } from "../paths.ts";
import { useIsSplitView } from "../split-view.ts";
import ConversationListSkeleton from "./ConversationListSkeleton.tsx";
import ConversationViewerSkeleton from "./ConversationViewerSkeleton.tsx";

interface MessagesPageSkeletonProps {
  // The messages page URL being loaded.
  pathname: string;
}

// Stands in for MessagesPage while it loads from another page. Split view
// always opens a conversation (the newest one if the URL names none), so it
// shows both; single-column view shows the screen the URL leads to.
function MessagesPageSkeleton({ pathname }: MessagesPageSkeletonProps) {
  const isSplit = useIsSplitView();
  const isConversationOpen = matchPath(CONVERSATION_PATH, pathname) !== null;

  if (!isSplit) {
    return (
      <div className="flex h-full w-full">
        {isConversationOpen ? (
          <ConversationViewerSkeleton />
        ) : (
          <ConversationListSkeleton isSplitView={false} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <ConversationListSkeleton isSplitView />
      <ConversationViewerSkeleton />
    </div>
  );
}

export default MessagesPageSkeleton;
