const CONVERSATIONS_PATH = "/conversations";

// Route pattern of the messages page; no id selects the newest conversation.
const MESSAGES_ROUTE_PATH = `${CONVERSATIONS_PATH}/:conversationId?`;

// Resource route: its loader looks up recipients, its action starts a
// conversation. The static segment outranks MESSAGES_ROUTE_PATH's param.
const NEW_CONVERSATION_PATH = `${CONVERSATIONS_PATH}/new`;

function conversationPath(id: number): string {
  return `${CONVERSATIONS_PATH}/${String(id)}`;
}

export {
  CONVERSATIONS_PATH,
  MESSAGES_ROUTE_PATH,
  NEW_CONVERSATION_PATH,
  conversationPath,
};
