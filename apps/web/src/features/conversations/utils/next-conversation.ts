// The conversation to open once `archivedId` leaves the list: the one below
// it, which moves into its place, or the one above when it was last. Null when
// nothing else is left, or when `archivedId` isn't in the list.
function getNextConversationId(
  conversations: readonly { id: number }[],
  archivedId: number,
): number | null {
  const index = conversations.findIndex(({ id }) => id === archivedId);
  if (index === -1) return null;
  const next = conversations.at(index + 1) ?? conversations.at(index - 1);
  return next && next.id !== archivedId ? next.id : null;
}

export { getNextConversationId };
