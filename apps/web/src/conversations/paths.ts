const CONVERSATIONS_PATH = "/conversations";

function conversationPath(id: number): string {
  return `${CONVERSATIONS_PATH}/${String(id)}`;
}

export { CONVERSATIONS_PATH, conversationPath };
