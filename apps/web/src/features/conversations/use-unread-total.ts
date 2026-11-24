import { useRouteLoaderData } from "react-router";
import {
  MESSAGES_ROUTE_ID,
  UNREAD_COUNT_ROUTE_ID,
  type MessagesPageData,
} from "./loaders.ts";

// The caller's unread messages across all conversations. Parent and child
// loaders run in parallel, so the unread-count loader can finish before the
// messages loader marks the opened conversation read. On the messages page the
// conversation list is fetched after that, so its sum is the fresher source.
function useUnreadTotal(): number {
  const messagesPage = useRouteLoaderData<MessagesPageData | undefined>(
    MESSAGES_ROUTE_ID,
  );
  const unreadCount = useRouteLoaderData<number | undefined>(
    UNREAD_COUNT_ROUTE_ID,
  );

  if (messagesPage) {
    return messagesPage.conversations.reduce(
      (sum, { unreadCount: count }) => sum + count,
      0,
    );
  }
  return unreadCount ?? 0;
}

export { useUnreadTotal };
