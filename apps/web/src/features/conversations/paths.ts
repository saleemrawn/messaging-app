const CONVERSATIONS_PATH = "/conversations";

// Route pattern of the messages page; no id selects the newest conversation.
const MESSAGES_ROUTE_PATH = `${CONVERSATIONS_PATH}/:conversationId?`;

function conversationPath(id: number): string {
  return `${CONVERSATIONS_PATH}/${String(id)}`;
}

export { CONVERSATIONS_PATH, MESSAGES_ROUTE_PATH, conversationPath };
