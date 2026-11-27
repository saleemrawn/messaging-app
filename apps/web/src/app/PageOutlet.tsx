import type { ReactNode } from "react";
import { matchPath, Outlet, useLocation } from "react-router";
import { usePendingPathname } from "../shared/hooks/use-pending-pathname.ts";
import { ARCHIVE_PATH, MESSAGES_ROUTE_PATH } from "../features/conversations/paths.ts";
import { CONTACTS_PATH } from "../features/contacts/paths.ts";
import ArchivePageSkeleton from "../features/conversations/components/ArchivePageSkeleton.tsx";
import MessagesPageSkeleton from "../features/conversations/components/MessagesPageSkeleton.tsx";
import ContactsPageSkeleton from "../features/contacts/components/ContactsPageSkeleton.tsx";

// The pages whose loaders fetch data, by route pattern, with their skeletons.
const PAGE_SKELETONS: readonly {
  path: string;
  render: (pathname: string) => ReactNode;
}[] = [
  {
    path: MESSAGES_ROUTE_PATH,
    render: (pathname) => <MessagesPageSkeleton pathname={pathname} />,
  },
  { path: CONTACTS_PATH, render: () => <ContactsPageSkeleton /> },
  { path: ARCHIVE_PATH, render: () => <ArchivePageSkeleton /> },
];

function findPage(pathname: string) {
  return PAGE_SKELETONS.find(({ path }) => matchPath(path, pathname) !== null);
}

// The current page, or, while another data page is loading, its skeleton.
// Navigation within a page (another conversation) is left to the page, so the
// parts that stay, like the conversation list, remain usable.
function PageOutlet() {
  const pendingPathname = usePendingPathname();
  const { pathname } = useLocation();
  const pendingPage = pendingPathname === null ? undefined : findPage(pendingPathname);

  if (pendingPathname === null || !pendingPage || pendingPage === findPage(pathname)) {
    return <Outlet />;
  }
  return pendingPage.render(pendingPathname);
}

export default PageOutlet;
