import { useState } from "react";
import { Pencil } from "lucide-react";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";
import type { User } from "../../auth/types.ts";
import AvatarUploadDialog from "./AvatarUploadDialog.tsx";

interface EditableAvatarProps {
  user: User;
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
        className="absolute right-0.5 bottom-0.5 flex size-9 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-md hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Pencil aria-hidden="true" strokeWidth={1.5} className="size-4" />
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
