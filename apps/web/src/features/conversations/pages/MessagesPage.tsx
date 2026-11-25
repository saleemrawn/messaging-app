import { useLoaderData } from "react-router";
import { useCurrentUser } from "../../auth/use-current-user.ts";
import ConversationList from "../components/ConversationList.tsx";
import ConversationViewer from "../components/ConversationViewer.tsx";
import type { MessagesPageData } from "../loaders.ts";
import { getNextConversationId } from "../utils/next-conversation.ts";

function MessagesPage() {
  const { conversations, conversation } = useLoaderData<MessagesPageData>();
  const currentUser = useCurrentUser();

  return (
    <div className="flex h-dvh">
      <ConversationList
        conversations={conversations}
        currentUserId={currentUser.id}
      />
      {conversation ? (
        <ConversationViewer
          key={conversation.id}
          conversation={conversation}
          currentUserId={currentUser.id}
          nextConversationId={getNextConversationId(
            conversations,
            conversation.id,
          )}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-white">
          <p className="text-gray-500">No conversation selected</p>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
