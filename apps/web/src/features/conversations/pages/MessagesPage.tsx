import { useLoaderData } from "react-router";
import { useCurrentUser } from "../../auth/use-current-user.ts";
import ConversationList from "../components/ConversationList.tsx";
import ConversationViewer from "../components/ConversationViewer.tsx";
import type { MessagesPageData } from "../loaders.ts";
import { getNextConversationId } from "../utils/next-conversation.ts";
import { useIsSplitView } from "../split-view.ts";

function MessagesPage() {
  const { conversations, conversation, isRecipientContact } =
    useLoaderData<MessagesPageData>();
  const currentUser = useCurrentUser();
  const isSplit = useIsSplitView();

  const list = (
    <ConversationList
      conversations={conversations}
      currentUserId={currentUser.id}
      isSplitView={isSplit}
    />
  );
  const viewer = conversation && (
    <ConversationViewer
      key={conversation.id}
      conversation={conversation}
      currentUserId={currentUser.id}
      isRecipientContact={isRecipientContact}
      nextConversationId={getNextConversationId(conversations, conversation.id)}
    />
  );

  // Single-column view shows one screen at a time: the open conversation, or
  // else the list.
  if (!isSplit) {
    return <div className="flex h-full w-full">{viewer ?? list}</div>;
  }

  return (
    <div className="flex h-full w-full">
      {list}
      {viewer ?? (
        <div className="flex flex-1 items-center justify-center bg-white">
          <p className="text-gray-500">No conversation selected</p>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
