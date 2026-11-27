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
  conversationContactsLoader,
  messagesPageLoader,
  recipientLookupLoader,
  shouldRevalidateUnreadCount,
  unreadCountLoader,
} from "../features/conversations/loaders.ts";
import {
  addRecipientContactAction,
  archiveConversationAction,
  createConversationAction,
  sendMessageAction,
  unarchiveConversationAction,
} from "../features/conversations/actions.ts";
import {
  ADD_RECIPIENT_CONTACT_PATH,
  ARCHIVE_CONVERSATION_PATH,
  ARCHIVE_PATH,
  CONVERSATIONS_PATH,
  MESSAGES_ROUTE_PATH,
  NEW_CONVERSATION_CONTACTS_PATH,
  NEW_CONVERSATION_PATH,
} from "../features/conversations/paths.ts";
import {
  contactLookupLoader,
  contactsPageLoader,
} from "../features/contacts/loaders.ts";
import {
  addContactAction,
  removeContactAction,
} from "../features/contacts/actions.ts";
import {
  ADD_CONTACT_PATH,
  CONTACTS_PATH,
} from "../features/contacts/paths.ts";
import AppLayout from "./AppLayout.tsx";
import MessagesPage from "../features/conversations/pages/MessagesPage.tsx";
import ArchivePage from "../features/conversations/pages/ArchivePage.tsx";
import ContactsPage from "../features/contacts/pages/ContactsPage.tsx";
import LoginPage from "../features/auth/pages/LoginPage.tsx";
import ProfilePage from "../features/profile/pages/ProfilePage.tsx";
import ErrorPage from "./ErrorPage.tsx";
import RootLayout from "./RootLayout.tsx";
import AppLoading from "./AppLoading.tsx";

const routes: RouteObject[] = [
  {
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    // First load: covers every route below until its loaders have run.
    HydrateFallback: AppLoading,
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
                // Resource route for the new conversation dialog's contacts.
                path: NEW_CONVERSATION_CONTACTS_PATH,
                loader: conversationContactsLoader,
                // Loaded once per dialog; a failed create mustn't reload it.
                shouldRevalidate: () => false,
              },
              {
                // Resource route for the viewer's Archive button.
                path: ARCHIVE_CONVERSATION_PATH,
                action: archiveConversationAction,
              },
              {
                // Resource route for the viewer's Add contact button.
                path: ADD_RECIPIENT_CONTACT_PATH,
                action: addRecipientContactAction,
              },
              {
                id: MESSAGES_ROUTE_ID,
                path: MESSAGES_ROUTE_PATH,
                loader: messagesPageLoader,
                action: sendMessageAction,
                Component: MessagesPage,
              },
              {
                // Resource route for the add contact dialog's fetchers.
                path: ADD_CONTACT_PATH,
                loader: contactLookupLoader,
                action: addContactAction,
                // A lookup doesn't depend on any action; don't redo it after one.
                shouldRevalidate: () => false,
              },
              {
                path: CONTACTS_PATH,
                loader: contactsPageLoader,
                action: removeContactAction,
                Component: ContactsPage,
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
