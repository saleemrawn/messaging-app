import UserAvatar from "../../../shared/components/UserAvatar.tsx";
import type { User } from "../../auth/types.ts";
import AvatarDropzone from "./AvatarDropzone.tsx";

interface AvatarPickerStepProps {
  user: User;
  isBusy: boolean;
  isRemoving: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  onCancel: () => void;
}

// The uploader's first step: the current photo, a place to pick a new one,
// and Remove photo when there's one to remove.
function AvatarPickerStep({
  user,
  isBusy,
  isRemoving,
  onFile,
  onRemove,
  onCancel,
}: AvatarPickerStepProps) {
  return (
    <>
      <div className="flex justify-center">
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={user.avatarUrl}
          size="xl"
        />
      </div>
      <AvatarDropzone onFile={onFile} isDisabled={isBusy} />
      <div className="flex justify-between gap-2">
        {user.avatarUrl ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={isBusy}
            className="rounded-lg px-4 py-2 font-medium text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          >
            {isRemoving ? "Removing…" : "Remove photo"}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="rounded-lg border border-line-strong px-4 py-2 font-medium text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export default AvatarPickerStep;
