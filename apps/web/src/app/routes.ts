import { redirect, type RouteObject } from "react-router";
import {
  APP_ROUTE_ID,
  guestOnlyLoader,
  requireUserLoader,
} from "../features/auth/loaders.ts";
import {
  MESSAGES_ROUTE_ID,
  UNREAD_COUNT_ROUTE_ID,
  archivePageLoader,
  messagesPageLoader,
  recipientLookupLoader,
  shouldRevalidateUnreadCount,
  unreadCountLoader,
} from "../features/conversations/loaders.ts";
import {
  archiveConversationAction,
  createConversationAction,
  sendMessageAction,
  unarchiveConversationAction,
} from "../features/conversations/actions.ts";
import {
  ARCHIVE_CONVERSATION_PATH,
  ARCHIVE_PATH,
  CONVERSATIONS_PATH,
  MESSAGES_ROUTE_PATH,
  NEW_CONVERSATION_PATH,
} from "../features/conversations/paths.ts";
import AppLayout from "./AppLayout.tsx";
import MessagesPage from "../features/conversations/pages/MessagesPage.tsx";
import ArchivePage from "../features/conversations/pages/ArchivePage.tsx";
import LoginPage from "../features/auth/pages/LoginPage.tsx";
import ProfilePage from "../features/profile/pages/ProfilePage.tsx";
import ErrorPage from "./ErrorPage.tsx";

const routes: RouteObject[] = [
  {
    ErrorBoundary: ErrorPage,
    children: [
      {
        // Pathless layout: every child requires a logged-in user and gets the sidebar.
        id: APP_ROUTE_ID,
        loader: requireUserLoader,
        Component: AppLayout,
        children: [
          {
            // Pathless: loads the sidebar's unread total on every app page.
            id: UNREAD_COUNT_ROUTE_ID,
            loader: unreadCountLoader,
            shouldRevalidate: shouldRevalidateUnreadCount,
            children: [
              { path: "/", loader: () => redirect(CONVERSATIONS_PATH) },
              {
                // Resource route for the new conversation dialog's fetchers.
                path: NEW_CONVERSATION_PATH,
                loader: recipientLookupLoader,
                action: createConversationAction,
                // A lookup doesn't depend on any action; don't redo it after one.
                shouldRevalidate: () => false,
              },
              {
                // Resource route for the viewer's Archive button.
                path: ARCHIVE_CONVERSATION_PATH,
                action: archiveConversationAction,
              },
              {
                id: MESSAGES_ROUTE_ID,
                path: MESSAGES_ROUTE_PATH,
                loader: messagesPageLoader,
                action: sendMessageAction,
                Component: MessagesPage,
              },
              {
                path: ARCHIVE_PATH,
                loader: archivePageLoader,
                action: unarchiveConversationAction,
                Component: ArchivePage,
              },
              { path: "/profile", Component: ProfilePage },
            ],
          },
        ],
      },
      { path: "/login", loader: guestOnlyLoader, Component: LoginPage },
      { path: "*", loader: () => redirect("/") },
    ],
  },
];

export { routes };
