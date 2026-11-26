import type { Recipient } from "../types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface RecipientOptionProps {
  recipient: Recipient;
  hasConversation: boolean;
  isPending: boolean;
  onSelect: (recipient: Recipient) => void;
}

function getActionLabel(hasConversation: boolean, isPending: boolean): string {
  if (isPending) return "Starting…";
  return hasConversation ? "Open conversation" : "Start conversation";
}

// A found recipient as one button whose text (name, email, action) is its
// accessible name.
function RecipientOption({
  recipient,
  hasConversation,
  isPending,
  onSelect,
}: RecipientOptionProps) {
  const fullName = formatFullName(recipient);

  return (
    <li>
      <button
        type="button"
        // aria-disabled rather than disabled keeps focus on the button.
        aria-disabled={isPending}
        onClick={() => {
          if (!isPending) onSelect(recipient);
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 aria-disabled:opacity-60"
      >
        <UserAvatar
          firstName={recipient.firstName}
          lastName={recipient.lastName}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-gray-900">
            {fullName}
          </span>
          <span className="block truncate text-sm text-gray-600">
            {recipient.email}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-blue-700">
          {getActionLabel(hasConversation, isPending)}
        </span>
      </button>
    </li>
  );
}

export default RecipientOption;
