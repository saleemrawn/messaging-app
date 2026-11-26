import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";
import { Archive, LogOut, MessageCircle, Users } from "lucide-react";
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
  { to: CONVERSATIONS_PATH, label: "Messages", Icon: MessageCircle },
  { to: CONTACTS_PATH, label: "Contacts", Icon: Users },
  { to: ARCHIVE_PATH, label: "Archive", Icon: Archive },
] as const;

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  const base =
    "flex h-11.5 items-center justify-between rounded-lg px-3.5 text-sm focus-visible:outline-2 focus-visible:outline-brand";
  return isActive
    ? `${base} bg-tint font-semibold text-brand`
    : `${base} text-ink hover:bg-tint/60`;
}

function accountLinkClassName({ isActive }: { isActive: boolean }): string {
  const base =
    "flex items-center gap-3 rounded-lg px-2.5 py-2 focus-visible:outline-2 focus-visible:outline-brand";
  return isActive ? `${base} bg-tint` : `${base} hover:bg-tint/60`;
}

interface SidebarProps {
  // Shown beside the logo, e.g. the drawer's close button.
  headerAction?: ReactNode;
}

// Fills whatever holds it: a fixed column on desktop, the drawer below it.
function Sidebar({ headerAction }: SidebarProps) {
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
    <aside className="flex h-full flex-col overflow-y-auto bg-sidebar px-3.5 pt-6 pb-4">
      <div className="mb-10 flex items-center justify-between gap-2">
        <p className="px-2.5 font-serif text-[25px] text-ink">Messenger</p>
        {headerAction}
      </div>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} className={navLinkClassName}>
                <span className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.5}
                  />
                  {label}
                </span>
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
            size="sm"
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-ink">
              {firstName} {lastName}
            </span>
            <span className="text-[10px] text-muted">My account</span>
          </span>
        </NavLink>
        <hr className="mx-2.5 border-line" />
        <FormError message={error} />
        <button
          type="button"
          aria-haspopup="dialog"
          disabled={isLoggingOut}
          className="flex h-11.5 items-center gap-3 rounded-lg px-3.5 text-left text-sm text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          onClick={() => {
            setIsConfirmOpen(true);
          }}
        >
          <LogOut aria-hidden="true" className="size-5" strokeWidth={1.5} />
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
