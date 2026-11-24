import { redirect, type RouteObject } from "react-router";
import {
  APP_ROUTE_ID,
  guestOnlyLoader,
  requireUserLoader,
} from "./auth/loaders.ts";
import { messagesPageLoader } from "./conversations/loaders.ts";
import { sendMessageAction } from "./conversations/actions.ts";
import { CONVERSATIONS_PATH } from "./conversations/paths.ts";
import AppLayout from "./components/AppLayout.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";

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
          { path: "/", loader: () => redirect(CONVERSATIONS_PATH) },
          {
            // No id selects the newest conversation.
            path: `${CONVERSATIONS_PATH}/:conversationId?`,
            loader: messagesPageLoader,
            action: sendMessageAction,
            Component: MessagesPage,
          },
          { path: "/profile", Component: ProfilePage },
        ],
      },
      { path: "/login", loader: guestOnlyLoader, Component: LoginPage },
      { path: "*", loader: () => redirect("/") },
    ],
  },
];

export { routes };
