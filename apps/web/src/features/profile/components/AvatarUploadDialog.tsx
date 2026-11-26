import {
  useId,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import FormError from "../../../shared/components/FormError.tsx";
import type { User } from "../../auth/types.ts";
import { useAvatarUpload } from "../use-avatar-upload.ts";
import AvatarCropper from "./AvatarCropper.tsx";
import AvatarPickerStep from "./AvatarPickerStep.tsx";

interface AvatarUploadDialogProps {
  user: User;
  // Called once the dialog has closed itself (Cancel, Escape, backdrop, or
  // after a change is saved).
  onClose: () => void;
}

// Pick a photo (or remove the current one), crop it to a circle, then upload.
// Saving happens here, independently of the profile form.
function AvatarUploadDialog({ user, onClose }: AvatarUploadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const upload = useAvatarUpload(user.id, closeDialog);

  // showModal() gives focus containment, an inert page behind and Escape.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  // Escape mustn't abandon an upload or removal halfway.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    if (upload.isBusy) event.preventDefault();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // Clicks inside the panel target its children; only the backdrop hits
    // the dialog element itself.
    if (event.target === dialogRef.current && !upload.isBusy) closeDialog();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-left shadow-xl backdrop:bg-gray-900/40"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          Profile photo
        </h2>
        <FormError message={upload.error} />
        {upload.source ? (
          <AvatarCropper
            imageUrl={upload.source.url}
            isUploading={upload.status === "uploading"}
            progress={upload.progress}
            onChooseAnother={upload.clearSource}
            onSave={(area) => void upload.save(area)}
          />
        ) : (
          <AvatarPickerStep
            user={user}
            isBusy={upload.isBusy}
            isRemoving={upload.status === "removing"}
            onFile={upload.selectFile}
            onRemove={() => void upload.remove()}
            onCancel={closeDialog}
          />
        )}
      </div>
    </dialog>
  );
}

export default AvatarUploadDialog;
