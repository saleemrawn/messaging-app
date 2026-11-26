import { useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useMediaQuery } from "../shared/hooks/use-media-query.ts";
import { useIsConversationFullScreen } from "../features/conversations/split-view.ts";
import { DESKTOP_QUERY } from "./layout-queries.ts";
import MobileTopBar from "./MobileTopBar.tsx";
import Sidebar from "./Sidebar.tsx";
import SidebarDrawer from "./SidebarDrawer.tsx";

function AppLayout() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isConversationFullScreen = useIsConversationFullScreen();
  const { key: locationKey } = useLocation();
  // The location the drawer was opened at. Any navigation gets a new key and
  // closes it, so picking a link in the drawer dismisses it. Growing to
  // desktop closes it too, so it doesn't reopen on shrinking back.
  const [menuLocationKey, setMenuLocationKey] = useState<string | null>(null);
  if (
    menuLocationKey !== null &&
    (isDesktop || menuLocationKey !== locationKey)
  ) {
    setMenuLocationKey(null);
  }
  const isMenuOpen = menuLocationKey === locationKey;
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setMenuLocationKey(null);
    menuButtonRef.current?.focus();
  }

  if (isDesktop) {
    return (
      <div className="flex h-dvh bg-canvas">
        <div className="w-54 shrink-0">
          <Sidebar />
        </div>
        <main className="flex min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  // An open conversation takes the whole screen in single-column view; its
  // header's back link returns to the list, which has the top bar.
  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {!isConversationFullScreen && (
        <MobileTopBar
          menuButtonRef={menuButtonRef}
          isMenuOpen={isMenuOpen}
          onOpenMenu={() => {
            setMenuLocationKey(locationKey);
          }}
        />
      )}
      {isMenuOpen && <SidebarDrawer onClose={closeMenu} />}
      <main className="flex min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
