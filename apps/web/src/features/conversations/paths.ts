const CONVERSATIONS_PATH = "/conversations";

// Route pattern of the messages page; no id selects the newest conversation.
const MESSAGES_ROUTE_PATH = `${CONVERSATIONS_PATH}/:conversationId?`;

// Resource route: its loader looks up recipients, its action starts a
// conversation. The static segment outranks MESSAGES_ROUTE_PATH's param.
const NEW_CONVERSATION_PATH = `${CONVERSATIONS_PATH}/new`;

// Resource route whose loader lists the caller's saved contacts for the new
// conversation dialog. Two segments deep, so it never matches the page route.
const NEW_CONVERSATION_CONTACTS_PATH = `${NEW_CONVERSATION_PATH}/contacts`;

// Resource route whose action archives the conversation. One segment deeper
// than MESSAGES_ROUTE_PATH, so the two never match the same URL.
const ARCHIVE_CONVERSATION_PATH = `${CONVERSATIONS_PATH}/:conversationId/archive`;

// Resource route whose action saves the conversation's recipient as a contact.
// One segment deeper than MESSAGES_ROUTE_PATH, like the archive route.
const ADD_RECIPIENT_CONTACT_PATH = `${CONVERSATIONS_PATH}/:conversationId/contact`;

// Top-level rather than under CONVERSATIONS_PATH, where the Messages nav link
// would match it and show as active too.
const ARCHIVE_PATH = "/archive";

function conversationPath(id: number): string {
  return `${CONVERSATIONS_PATH}/${String(id)}`;
}

function archiveConversationPath(id: number): string {
  return `${conversationPath(id)}/archive`;
}

function addRecipientContactPath(id: number): string {
  return `${conversationPath(id)}/contact`;
}

export {
  ADD_RECIPIENT_CONTACT_PATH,
  ARCHIVE_CONVERSATION_PATH,
  ARCHIVE_PATH,
  CONVERSATIONS_PATH,
  MESSAGES_ROUTE_PATH,
  NEW_CONVERSATION_CONTACTS_PATH,
  NEW_CONVERSATION_PATH,
  addRecipientContactPath,
  archiveConversationPath,
  conversationPath,
};
