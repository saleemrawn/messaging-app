import { redirect } from "react-router";
import { isUnauthorizedError } from "../auth/auth-service.ts";
import { getConversations } from "./conversation-service.ts";
import type { ConversationSummary } from "../types/api.ts";

// Runs in parallel with the layout's auth check, so a 401 here redirects too
// instead of surfacing on the error page. Anything else goes to the ErrorBoundary.
async function conversationsLoader(): Promise<ConversationSummary[] | Response> {
  try {
    return await getConversations();
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    throw error;
  }
}

export { conversationsLoader };
