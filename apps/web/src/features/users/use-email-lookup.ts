import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useCurrentUser } from "../auth/use-current-user.ts";
import type { UserLookupResult } from "./lookup.ts";
import type { UserSummary } from "./types.ts";

const LOOKUP_DEBOUNCE_MS = 300;
// Deliberately loose: it only decides when the address looks finished enough
// to look up. The API does the real validation.
const COMPLETE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_MESSAGES = {
  incomplete: "Enter their full email address",
  self: "That's your own email address",
  searching: "Searching…",
  "not-found": "No user found with that email address",
  error: "Couldn't search right now. Please try again.",
} as const;

type LookupStatus = keyof typeof STATUS_MESSAGES | "found";

interface EmailLookup {
  inputValue: string;
  setInputValue: (value: string) => void;
  // The user the current input found; null while there isn't one.
  user: UserSummary | null;
  // Empty once a user is found.
  statusMessage: string;
  isStatusError: boolean;
}

function lookupHref(lookupPath: string, email: string): string {
  return `${lookupPath}?${new URLSearchParams({ email }).toString()}`;
}

function getLookupStatus(
  email: string,
  ownEmail: string,
  result: UserLookupResult | undefined,
): LookupStatus {
  if (!COMPLETE_EMAIL_PATTERN.test(email)) return "incomplete";
  if (email.toLowerCase() === ownEmail.toLowerCase()) return "self";
  // A result for an older input is as good as none.
  if (result?.email !== email) return "searching";
  return result.status;
}

// Looks up the user with the typed email address once typing pauses, through
// the resource route at lookupPath (whose loader calls lookUpUser). The
// fetcher drops any response superseded by a newer load.
function useEmailLookup(lookupPath: string): EmailLookup {
  const currentUser = useCurrentUser();
  const fetcher = useFetcher<UserLookupResult>();
  const [inputValue, setInputValue] = useState("");

  const email = inputValue.trim();
  const status = getLookupStatus(email, currentUser.email, fetcher.data);
  const user =
    status === "found" && fetcher.data?.status === "found"
      ? fetcher.data.user
      : null;
  const shouldLookUp = status !== "incomplete" && status !== "self";
  const { load } = fetcher;

  useEffect(() => {
    if (!shouldLookUp) return;
    const timer = setTimeout(() => {
      void load(lookupHref(lookupPath, email));
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [shouldLookUp, lookupPath, email, load]);

  return {
    inputValue,
    setInputValue,
    user,
    statusMessage: status === "found" ? "" : STATUS_MESSAGES[status],
    isStatusError: status === "not-found" || status === "error",
  };
}

export { useEmailLookup };
export type { EmailLookup };
