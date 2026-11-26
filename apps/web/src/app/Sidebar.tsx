import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { logout } from "../features/auth/auth-service.ts";
import LogoutConfirmDialog from "../features/auth/components/LogoutConfirmDialog.tsx";
import { useCurrentUser } from "../features/auth/use-current-user.ts";
import type { LoginPageState } from "../features/auth/types.ts";
import {
  ARCHIVE_PATH,
  CONVERSATIONS_PATH,
} from "../features/conversations/paths.ts";
import { CONTACTS_PATH } from "../features/contacts/paths.ts";
import { useUnreadTotal } from "../features/conversations/use-unread-total.ts";
import UnreadBadge from "../features/conversations/components/UnreadBadge.tsx";
import FormError from "../shared/components/FormError.tsx";
import UserAvatar from "../shared/components/UserAvatar.tsx";

const LOGOUT_ERROR = "Couldn't log out. Please try again.";

const NAV_ITEMS = [
  { to: CONVERSATIONS_PATH, label: "Messages" },
  { to: CONTACTS_PATH, label: "Contacts" },
  { to: ARCHIVE_PATH, label: "Archive" },
] as const;

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  const base =
    "flex items-center justify-between rounded px-3 py-2 font-medium";
  return isActive
    ? `${base} bg-blue-50 text-blue-700`
    : `${base} text-gray-700 hover:bg-gray-100`;
}

function accountLinkClassName({ isActive }: { isActive: boolean }): string {
  const base = "flex items-center gap-3 rounded px-3 py-2";
  return isActive ? `${base} bg-blue-50` : `${base} hover:bg-gray-100`;
}

function Sidebar() {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string>();
  const unreadTotal = useUnreadTotal();
  const { firstName, lastName, avatarUrl } = useCurrentUser();

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(undefined);

    try {
      await logout();
      const state: LoginPageState = { mode: "login" };
      await navigate("/login", { replace: true, state });
    } catch {
      setError(LOGOUT_ERROR);
      setIsLoggingOut(false);
    }
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white p-4">
      <p className="mb-8 px-3 text-xl font-semibold">Messenger</p>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={navLinkClassName}>
                {label}
                {to === CONVERSATIONS_PATH && (
                  <UnreadBadge count={unreadTotal} />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <NavLink to="/profile" className={accountLinkClassName}>
          <UserAvatar
            firstName={firstName}
            lastName={lastName}
            avatarUrl={avatarUrl}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-gray-900">
              {firstName} {lastName}
            </span>
            <span className="text-sm text-gray-500">My account</span>
          </span>
        </NavLink>
        <hr className="border-gray-200" />
        <FormError message={error} />
        <button
          type="button"
          aria-haspopup="dialog"
          disabled={isLoggingOut}
          className="rounded px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => {
            setIsConfirmOpen(true);
          }}
        >
          {isLoggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
      {isConfirmOpen && (
        <LogoutConfirmDialog
          onConfirm={() => void handleLogout()}
          onClose={() => {
            setIsConfirmOpen(false);
          }}
        />
      )}
    </aside>
  );
}

export default Sidebar;
