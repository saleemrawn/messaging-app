import { prisma } from "../lib/prisma.ts";
import type { UserAccount } from "../../generated/prisma/client.ts";
import type { ContactResBody } from "../types/contact-types.ts";
import { profileSelect, toLookupUserResBody } from "../user/user-profile.ts";

interface AddContactResult {
  contact: ContactResBody;
  isCreated: boolean;
}

const contactAccountSelect = {
  id: true,
  user: { select: profileSelect },
} as const;

// A contact is shown the same way as a looked-up user.
const toContactResBody: (
  account: Parameters<typeof toLookupUserResBody>[0],
) => Promise<ContactResBody> = toLookupUserResBody;

// The caller's contacts sorted by name, skipping removed contacts and deleted
// accounts.
const getContacts = async (
  userAccountId: UserAccount["id"],
): Promise<ContactResBody[]> => {
  const contacts = await prisma.contact.findMany({
    where: {
      userAccountId,
      deletedAt: null,
      contactAccount: { deletedAt: null, user: { deletedAt: null } },
    },
    select: { contactAccount: { select: contactAccountSelect } },
    orderBy: [
      { contactAccount: { user: { firstName: "asc" } } },
      { contactAccount: { user: { lastName: "asc" } } },
    ],
  });

  return Promise.all(
    contacts.map(({ contactAccount }) => toContactResBody(contactAccount)),
  );
};

// Adds the contact, or restores one the caller removed earlier. isCreated is
// false only when they were already an active contact.
const addContact = async (
  userAccountId: UserAccount["id"],
  contactAccountId: UserAccount["id"],
): Promise<AddContactResult> => {
  const key = { userAccountId, contactAccountId };
  const existing = await prisma.contact.findUnique({
    where: { userAccountId_contactAccountId: key },
    select: { deletedAt: true },
  });

  const { contactAccount } = await prisma.contact.upsert({
    where: { userAccountId_contactAccountId: key },
    create: key,
    update: { deletedAt: null },
    select: { contactAccount: { select: contactAccountSelect } },
  });

  return {
    contact: await toContactResBody(contactAccount),
    isCreated: existing?.deletedAt !== null,
  };
};

// Soft-deletes the contact from the caller's list. False when it wasn't there.
const removeContact = async (
  userAccountId: UserAccount["id"],
  contactAccountId: UserAccount["id"],
): Promise<boolean> => {
  const { count } = await prisma.contact.updateMany({
    where: { userAccountId, contactAccountId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count > 0;
};

export { getContacts, addContact, removeContact };
