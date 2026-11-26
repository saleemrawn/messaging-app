import { useId, useLayoutEffect, useRef, type MouseEvent } from "react";

interface LogoutConfirmDialogProps {
  onConfirm: () => void;
  // Called once the dialog has closed itself (either button, Escape, backdrop).
  onClose: () => void;
}

function LogoutConfirmDialog({ onConfirm, onClose }: LogoutConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // showModal() gives focus containment, an inert page behind and Escape.
  // Cancel is focused explicitly (autoFocus doesn't set the attribute
  // showModal() looks for) so an accidental Enter doesn't log out.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    cancelRef.current?.focus();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleConfirm() {
    onConfirm();
    closeDialog();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // Clicks inside the panel target its children; only the backdrop hits
    // the dialog element itself.
    if (event.target === dialogRef.current) closeDialog();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          Logout Confirmation
        </h2>
        <p id={descriptionId} className="text-gray-700">
          Are you sure you want to logout?
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={closeDialog}
            className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Logout
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default LogoutConfirmDialog;
