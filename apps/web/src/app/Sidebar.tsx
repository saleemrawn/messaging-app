import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { logout } from "../features/auth/auth-service.ts";
import { CONVERSATIONS_PATH } from "../features/conversations/paths.ts";
import FormError from "../shared/components/FormError.tsx";

const LOGOUT_ERROR = "Couldn't log out. Please try again.";

const NAV_ITEMS = [
  { to: CONVERSATIONS_PATH, label: "Messages" },
  { to: "/profile", label: "Profile" },
] as const;

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  const base = "block rounded px-3 py-2 font-medium";
  return isActive
    ? `${base} bg-blue-50 text-blue-700`
    : `${base} text-gray-700 hover:bg-gray-100`;
}

function Sidebar() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string>();

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(undefined);

    try {
      await logout();
      await navigate("/login", { replace: true });
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
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <FormError message={error} />
        <button
          type="button"
          disabled={isLoggingOut}
          className="rounded px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
