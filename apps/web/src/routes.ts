import { redirect, type RouteObject } from "react-router";
import { guestOnlyLoader, requireUserLoader } from "./auth/loaders.ts";
import AppLayout from "./components/AppLayout.tsx";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";

const routes: RouteObject[] = [
  {
    ErrorBoundary: ErrorPage,
    children: [
      {
        // Pathless layout: every child requires a logged-in user and gets the sidebar.
        loader: requireUserLoader,
        Component: AppLayout,
        children: [
          { path: "/", Component: HomePage },
          { path: "/profile", Component: ProfilePage },
        ],
      },
      { path: "/login", loader: guestOnlyLoader, Component: LoginPage },
      { path: "*", loader: () => redirect("/") },
    ],
  },
];

export { routes };
