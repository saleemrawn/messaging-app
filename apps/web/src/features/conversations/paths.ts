const CONVERSATIONS_PATH = "/conversations";

// Route pattern of the messages page; no id selects the newest conversation.
const MESSAGES_ROUTE_PATH = `${CONVERSATIONS_PATH}/:conversationId?`;

// Resource route: its loader looks up recipients, its action starts a
// conversation. The static segment outranks MESSAGES_ROUTE_PATH's param.
const NEW_CONVERSATION_PATH = `${CONVERSATIONS_PATH}/new`;

// Resource route whose action archives the conversation. One segment deeper
// than MESSAGES_ROUTE_PATH, so the two never match the same URL.
const ARCHIVE_CONVERSATION_PATH = `${CONVERSATIONS_PATH}/:conversationId/archive`;

// Top-level rather than under CONVERSATIONS_PATH, where the Messages nav link
// would match it and show as active too.
const ARCHIVE_PATH = "/archive";

function conversationPath(id: number): string {
  return `${CONVERSATIONS_PATH}/${String(id)}`;
}

function archiveConversationPath(id: number): string {
  return `${conversationPath(id)}/archive`;
}

export {
  ARCHIVE_CONVERSATION_PATH,
  ARCHIVE_PATH,
  CONVERSATIONS_PATH,
  MESSAGES_ROUTE_PATH,
  NEW_CONVERSATION_PATH,
  archiveConversationPath,
  conversationPath,
};
