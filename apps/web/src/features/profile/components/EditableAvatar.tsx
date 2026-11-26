import { useState } from "react";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";
import type { User } from "../../auth/types.ts";
import AvatarUploadDialog from "./AvatarUploadDialog.tsx";

interface EditableAvatarProps {
  user: User;
}

// Lucide "pencil" (ISC licence), drawn at a 1.5 stroke.
function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

// The profile avatar while editing, with a pencil button at its bottom-right
// that opens the photo uploader.
function EditableAvatar({ user }: EditableAvatarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="relative">
      <UserAvatar
        firstName={user.firstName}
        lastName={user.lastName}
        avatarUrl={user.avatarUrl}
        size="xl"
      />
      <button
        type="button"
        aria-label="Change profile photo"
        aria-haspopup="dialog"
        onClick={() => {
          setIsDialogOpen(true);
        }}
        className="absolute right-0.5 bottom-0.5 flex size-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <PencilIcon />
      </button>
      {isDialogOpen && (
        <AvatarUploadDialog
          user={user}
          onClose={() => {
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default EditableAvatar;
