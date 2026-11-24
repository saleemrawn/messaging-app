import { useRouteLoaderData } from "react-router";
import { APP_ROUTE_ID } from "./loaders.ts";
import type { User } from "./types.ts";

// Only valid inside the authenticated layout, whose loader guarantees a user.
function useCurrentUser(): User {
  const user = useRouteLoaderData<User | undefined>(APP_ROUTE_ID);
  if (!user) {
    throw new Error("useCurrentUser must be used inside the app layout route");
  }
  return user;
}

export { useCurrentUser };
