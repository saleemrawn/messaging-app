import { matchPath, useLoaderData } from "react-router";
import { useCurrentUser } from "../../auth/use-current-user.ts";
import { usePendingPathname } from "../../../shared/hooks/use-pending-pathname.ts";
import ConversationList from "../components/ConversationList.tsx";
import ConversationListSkeleton from "../components/ConversationListSkeleton.tsx";
import ConversationViewer from "../components/ConversationViewer.tsx";
import ConversationViewerSkeleton from "../components/ConversationViewerSkeleton.tsx";
import type { MessagesPageData } from "../loaders.ts";
import { CONVERSATION_PATH, CONVERSATIONS_PATH } from "../paths.ts";
import { getNextConversationId } from "../utils/next-conversation.ts";
import { useIsSplitView } from "../split-view.ts";
import PageTitle from "../../../shared/components/PageTitle.tsx";

type PendingScreen = "conversation" | "list" | null;

// Which screen of this page a pending navigation is loading, if any.
function getPendingScreen(pendingPathname: string | null): PendingScreen {
  if (pendingPathname === null) return null;
  if (matchPath(CONVERSATION_PATH, pendingPathname)) return "conversation";
  return pendingPathname === CONVERSATIONS_PATH ? "list" : null;
}

function MessagesPage() {
  const { conversations, conversation, isRecipientContact } =
    useLoaderData<MessagesPageData>();
  const currentUser = useCurrentUser();
  const isSplit = useIsSplitView();
  const pendingScreen = getPendingScreen(usePendingPathname());

  // In split view the list stays put (and usable) while a conversation loads.
  const list =
    pendingScreen === "list" && !isSplit ? (
      <ConversationListSkeleton isSplitView={false} />
    ) : (
      <ConversationList
        conversations={conversations}
        currentUserId={currentUser.id}
        isSplitView={isSplit}
      />
    );
  const loadedViewer = conversation && (
    <ConversationViewer
      key={conversation.id}
      conversation={conversation}
      currentUserId={currentUser.id}
      isRecipientContact={isRecipientContact}
      nextConversationId={getNextConversationId(conversations, conversation.id)}
    />
  );
  const viewer =
    pendingScreen === "conversation" ? (
      <ConversationViewerSkeleton />
    ) : (
      loadedViewer
    );

  const title = <PageTitle name="Messages" />;

  // Single-column view shows one screen at a time: the open conversation, or
  // else the list.
  if (!isSplit) {
    const screen = pendingScreen === "list" ? list : (viewer ?? list);
    return (
      <div className="flex h-full w-full">
        {title}
        {screen}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {title}
      {list}
      {viewer ?? (
        <div className="flex flex-1 items-center justify-center bg-canvas">
          <p className="text-sm text-muted">No conversation selected</p>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
