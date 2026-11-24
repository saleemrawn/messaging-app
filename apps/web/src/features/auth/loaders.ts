import { redirect } from "react-router";
import { getCurrentUser } from "./auth-service.ts";
import type { User } from "./types.ts";

// Route id of the authenticated layout, whose loader data is the current user.
const APP_ROUTE_ID = "app";

async function requireUserLoader(): Promise<User | Response> {
  const user = await getCurrentUser();
  return user ?? redirect("/login");
}

async function guestOnlyLoader(): Promise<Response | null> {
  const user = await getCurrentUser();
  return user ? redirect("/") : null;
}

export { APP_ROUTE_ID, requireUserLoader, guestOnlyLoader };
