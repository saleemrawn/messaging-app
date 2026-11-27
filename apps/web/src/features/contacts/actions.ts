import { redirect, replace, type ActionFunctionArgs } from "react-router";
import {
  isUnauthorizedError,
  parseApiError,
} from "../../shared/api/api-errors.ts";
import { addContact, removeContact } from "./contacts-service.ts";
import { CONTACTS_PATH } from "./paths.ts";
import {
  showErrorToast,
  showSuccessToast,
} from "../../shared/utils/toast.ts";

const ADD_FAILED_ERROR = "Couldn't add the contact. Please try again.";
const REMOVE_FAILED_ERROR = "Couldn't remove the contact. Please try again.";
const ADDED_MESSAGE = "Contact added";
const REMOVED_MESSAGE = "Contact removed";

// Failures are reported with a toast, since the row may be gone by then.
interface RemoveContactResult {
  ok: boolean;
}
// Success navigates back to the page, so only failures carry data.
interface AddContactResult {
  ok: false;
  error: string;
}

function readContactId(formData: FormData): number | null {
  const value = formData.get("contactId");
  const id = typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Adds the user picked in the dialog. Replacing the location gives it a new
// key, which closes the dialog, and revalidates the page's list.
async function addContactAction({
  request,
}: ActionFunctionArgs): Promise<AddContactResult | Response> {
  const contactId = readContactId(await request.formData());
  if (contactId === null) return { ok: false, error: ADD_FAILED_ERROR };

  try {
    await addContact(contactId);
    showSuccessToast(ADDED_MESSAGE);
    return replace(CONTACTS_PATH);
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    return {
      ok: false,
      error: parseApiError(error).message ?? ADD_FAILED_ERROR,
    };
  }
}

// Removes a row's contact. The router revalidates the page loader afterwards,
// which drops the row.
async function removeContactAction({
  request,
}: ActionFunctionArgs): Promise<RemoveContactResult | Response> {
  const contactId = readContactId(await request.formData());
  if (contactId === null) {
    showErrorToast(REMOVE_FAILED_ERROR);
    return { ok: false };
  }

  try {
    await removeContact(contactId);
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) return redirect("/login");
    showErrorToast(REMOVE_FAILED_ERROR);
    return { ok: false };
  }

  showSuccessToast(REMOVED_MESSAGE);
  return { ok: true };
}

export { addContactAction, removeContactAction };
export type { AddContactResult, RemoveContactResult };
