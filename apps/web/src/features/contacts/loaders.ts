import { redirect, type LoaderFunctionArgs } from "react-router";
import { isUnauthorizedError } from "../../shared/api/api-errors.ts";
import { lookUpUser, type UserLookupResult } from "../users/lookup.ts";
import { getContacts } from "./contacts-service.ts";
import { CONTACTS_PATH } from "./paths.ts";
import type { Contact } from "./types.ts";

// Runs in parallel with the layout's auth check, so a 401 redirects too.
async function contactsPageLoader(): Promise<Contact[] | Response> {
  try {
    return await getContacts();
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    throw error;
  }
}

// Loaded by the add contact dialog's fetcher.
function contactLookupLoader({
  request,
}: LoaderFunctionArgs): Promise<UserLookupResult | Response> {
  return lookUpUser(request, CONTACTS_PATH);
}

export { contactsPageLoader, contactLookupLoader };
