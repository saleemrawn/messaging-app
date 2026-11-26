import { http, HttpResponse } from "msw";
import { API_URL, server, unreadCountHandler } from "../../test/server.ts";
import type { Contact } from "./types.ts";
import type {
  ConversationDetail,
  ConversationSummary,
} from "../conversations/types.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

const aisha: Contact = {
  id: 2,
  firstName: "Aisha",
  lastName: "Khan",
  email: "aisha.khan@email.com",
  avatarUrl: null,
};

const jane: Contact = {
  id: 4,
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@email.com",
  avatarUrl: null,
};

const phillipe: Contact = {
  id: 3,
  firstName: "Phillipe",
  lastName: "Martin",
  email: "phillipe.martin@email.com",
  avatarUrl: null,
};

// Everyone the lookup endpoint knows besides the current user.
const KNOWN_USERS = [aisha, jane, phillipe];

interface MockContactsApiOptions {
  contacts?: Contact[];
  addStatus?: number;
  removeStatus?: number;
  createConversationStatus?: number;
}

// Conversation ids the mock hands out, offset so they never look like user ids.
const CONVERSATION_ID_OFFSET = 10;

function byName(a: Contact, b: Contact): number {
  return (
    a.firstName.localeCompare(b.firstName) ||
    a.lastName.localeCompare(b.lastName)
  );
}

function toConversationDetail(recipient: Contact): ConversationDetail {
  return {
    id: CONVERSATION_ID_OFFSET + recipient.id,
    updatedAt: new Date().toISOString(),
    recipient,
    messages: [],
  };
}

function toConversationSummary({
  id,
  updatedAt,
  recipient,
}: ConversationDetail): ConversationSummary {
  return { id, updatedAt, unreadCount: 0, recipient, latestMessage: null };
}

// An in-memory contacts list that behaves like the real API: adding inserts in
// name order, removing drops the row. Starting a conversation with a user
// creates an empty one (id CONVERSATION_ID_OFFSET + user id), or reuses it.
function mockContactsApi({
  contacts = [aisha, phillipe],
  addStatus = 201,
  removeStatus = 200,
  createConversationStatus = 201,
}: MockContactsApiOptions = {}) {
  let current = [...contacts].sort(byName);
  let conversations: ConversationDetail[] = [];
  const lookupEmails: string[] = [];
  const addBodies: unknown[] = [];
  const removeRequests: number[] = [];
  const createConversationBodies: unknown[] = [];

  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
    unreadCountHandler(),
    http.get(`${API_URL}/contacts`, () =>
      HttpResponse.json({ success: true, data: current }),
    ),
    http.get(`${API_URL}/users/lookup`, ({ request }) => {
      const email = new URL(request.url).searchParams.get("email") ?? "";
      lookupEmails.push(email);
      const found = KNOWN_USERS.find(
        (user) => user.email === email.toLowerCase(),
      );
      return found
        ? HttpResponse.json({ success: true, data: found })
        : HttpResponse.json(
            { success: false, message: "User not found" },
            { status: 404 },
          );
    }),
    http.post(`${API_URL}/contacts`, async ({ request }) => {
      const body = (await request.json()) as { contactId: number };
      addBodies.push(body);
      if (addStatus >= 400) {
        return HttpResponse.json(
          { success: false, message: "Something broke" },
          { status: addStatus },
        );
      }
      const added = KNOWN_USERS.find(({ id }) => id === body.contactId);
      if (added && !current.some(({ id }) => id === added.id)) {
        current = [...current, added].sort(byName);
      }
      return HttpResponse.json(
        { success: true, data: added },
        { status: addStatus },
      );
    }),
    http.delete(`${API_URL}/contacts/:id`, ({ params }) => {
      const id = Number(params.id);
      removeRequests.push(id);
      if (removeStatus !== 200) {
        return HttpResponse.json(
          { success: false, message: "Something went wrong" },
          { status: removeStatus },
        );
      }
      current = current.filter((contact) => contact.id !== id);
      return HttpResponse.json({ success: true, data: { id } });
    }),
    http.get(`${API_URL}/conversations`, () =>
      HttpResponse.json({
        success: true,
        data: conversations.map(toConversationSummary),
      }),
    ),
    http.post(`${API_URL}/conversations`, async ({ request }) => {
      const body = (await request.json()) as { recipientId: number };
      createConversationBodies.push(body);
      const recipient = KNOWN_USERS.find(({ id }) => id === body.recipientId);
      if (createConversationStatus >= 400 || !recipient) {
        return HttpResponse.json(
          { success: false, message: "Something broke" },
          { status: recipient ? createConversationStatus : 404 },
        );
      }
      const conversation = toConversationDetail(recipient);
      if (!conversations.some(({ id }) => id === conversation.id)) {
        conversations = [conversation, ...conversations];
      }
      return HttpResponse.json(
        { success: true, data: { id: conversation.id } },
        { status: createConversationStatus },
      );
    }),
    http.post(`${API_URL}/conversations/:id/messages/receipts`, () =>
      HttpResponse.json({ success: true }),
    ),
    http.get(`${API_URL}/conversations/:id`, ({ params }) => {
      const found = conversations.find(({ id }) => id === Number(params.id));
      return found
        ? HttpResponse.json({ success: true, data: found })
        : HttpResponse.json(
            { success: false, message: "Conversation not found" },
            { status: 404 },
          );
    }),
  );

  return { lookupEmails, addBodies, removeRequests, createConversationBodies };
}

export { currentUser, aisha, jane, phillipe, mockContactsApi };
