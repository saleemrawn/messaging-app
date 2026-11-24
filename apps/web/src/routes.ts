import { redirect, type RouteObject } from "react-router";
import { guestOnlyLoader, requireUserLoader } from "./auth/loaders.ts";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";

const routes: RouteObject[] = [
  {
    ErrorBoundary: ErrorPage,
    children: [
      { path: "/", loader: requireUserLoader, Component: HomePage },
      { path: "/login", loader: guestOnlyLoader, Component: LoginPage },
      { path: "*", loader: () => redirect("/") },
    ],
  },
];

export { routes };
