import { redirect } from "react-router";
import { getCurrentUser } from "./auth-service.ts";
import type { User } from "../types/api.ts";

async function requireUserLoader(): Promise<User | Response> {
  const user = await getCurrentUser();
  return user ?? redirect("/login");
}

async function guestOnlyLoader(): Promise<Response | null> {
  const user = await getCurrentUser();
  return user ? redirect("/") : null;
}

export { requireUserLoader, guestOnlyLoader };
