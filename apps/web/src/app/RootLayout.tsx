import { Outlet } from "react-router";
import Toaster from "../shared/components/Toaster.tsx";

// Shared by /login and the logged-in layout, so a toast survives navigating
// between them (e.g. "You've been logged out").
function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

export default RootLayout;
