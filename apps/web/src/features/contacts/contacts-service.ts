import { api } from "../../shared/api/client.ts";
import type { ApiResponse } from "../../shared/api/types.ts";
import type { Contact } from "./types.ts";

// The caller's contacts, sorted by name by the API.
async function getContacts(): Promise<Contact[]> {
  const res = await api.get<ApiResponse<Contact[]>>("/contacts");
  return res.data.success ? (res.data.data ?? []) : [];
}

// Adds the user to the caller's contacts. Safe to repeat.
async function addContact(contactId: number): Promise<void> {
  await api.post<ApiResponse<Contact>, { contactId: number }>("/contacts", {
    contactId,
  });
}

// Removes the user from the caller's contacts only; theirs is unchanged.
async function removeContact(contactId: number): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/contacts/${String(contactId)}`);
}

export { getContacts, addContact, removeContact };
