import { useLayoutEffect, useRef, type MouseEvent } from "react";
import { X } from "lucide-react";
import Sidebar from "./Sidebar.tsx";

interface SidebarDrawerProps {
  // Called once the drawer has closed itself (close button, Escape, backdrop).
  // Navigating unmounts it instead, without calling this.
  onClose: () => void;
}

// The sidebar as a modal panel on the left, below desktop. showModal() gives
// focus containment, an inert page behind and Escape.
function SidebarDrawer({ onClose }: SidebarDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();
  }, []);

  function closeDrawer() {
    dialogRef.current?.close();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The sidebar fills the panel, so only the backdrop hits the dialog itself.
    if (event.target === dialogRef.current) closeDrawer();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Menu"
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-sidebar p-0 shadow-xl backdrop:bg-ink/40"
    >
      <Sidebar
        headerAction={
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close menu"
            onClick={closeDrawer}
            className="rounded-lg p-2 text-muted hover:bg-tint/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X aria-hidden="true" strokeWidth={1.5} />
          </button>
        }
      />
    </dialog>
  );
}

export default SidebarDrawer;
