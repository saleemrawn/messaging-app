import { useLoaderData } from "react-router";
import { useCurrentUser } from "../auth/use-current-user.ts";
import ConversationList from "../components/ConversationList.tsx";
import type { ConversationSummary } from "../types/api.ts";

function HomePage() {
  const conversations = useLoaderData<ConversationSummary[]>();
  const currentUser = useCurrentUser();

  return (
    <ConversationList
      conversations={conversations}
      currentUserId={currentUser.id}
    />
  );
}

export default HomePage;
