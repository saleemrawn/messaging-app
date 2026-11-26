import type { UserSummary } from "../../users/types.ts";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";

interface ContactOptionProps {
  user: UserSummary;
  isContact: boolean;
  isPending: boolean;
  onSelect: (user: UserSummary) => void;
}

function getActionLabel(isContact: boolean, isPending: boolean): string {
  if (isContact) return "Already a contact";
  return isPending ? "Adding…" : "Add contact";
}

// A found user as one button whose text (name, email, action) is its
// accessible name. Someone already in the list can't be picked again.
function ContactOption({
  user,
  isContact,
  isPending,
  onSelect,
}: ContactOptionProps) {
  const isUnavailable = isContact || isPending;

  return (
    <li>
      <button
        type="button"
        // aria-disabled rather than disabled keeps focus on the button.
        aria-disabled={isUnavailable}
        onClick={() => {
          if (!isUnavailable) onSelect(user);
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600 aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:bg-transparent"
      >
        <UserAvatar firstName={user.firstName} lastName={user.lastName} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-gray-900">
            {formatFullName(user)}
          </span>
          <span className="block truncate text-sm text-gray-600">
            {user.email}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-blue-700">
          {getActionLabel(isContact, isPending)}
        </span>
      </button>
    </li>
  );
}

export default ContactOption;
