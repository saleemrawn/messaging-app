import { isAxiosError } from "axios";
import { redirect } from "react-router";
import { isUnauthorizedError } from "../../shared/api/api-errors.ts";
import { findUserByEmail } from "./user-service.ts";
import type { UserSummary } from "./types.ts";

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

// Carries the email it answers for, so a dialog can ignore a result that
// arrives after the input has changed.
type UserLookupResult =
  | { email: string; status: "found"; user: UserSummary }
  | { email: string; status: "not-found" }
  | { email: string; status: "error" };

function isNoSuchUserError(error: unknown): boolean {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === HTTP_NOT_FOUND || status === HTTP_BAD_REQUEST;
}

// The body of an email lookup resource route's loader, called by a dialog's
// fetcher. Failures become a status the dialog can show rather than reaching
// the error page. With no email (only reachable by typing the URL) there's
// nothing to show, so it redirects to fallbackPath.
async function lookUpUser(
  request: Request,
  fallbackPath: string,
): Promise<UserLookupResult | Response> {
  const email = new URL(request.url).searchParams.get("email")?.trim() ?? "";
  if (!email) return redirect(fallbackPath);

  try {
    const user = await findUserByEmail(email);
    return { email, status: "found", user };
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    if (isNoSuchUserError(error)) return { email, status: "not-found" };
    return { email, status: "error" };
  }
}

export { lookUpUser };
export type { UserLookupResult };
