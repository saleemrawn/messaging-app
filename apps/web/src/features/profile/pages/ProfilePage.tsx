import { useState } from "react";
import { useCurrentUser } from "../../auth/use-current-user.ts";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";
import { formatFullName } from "../../../shared/utils/full-name.ts";
import EditProfileForm from "../components/EditProfileForm.tsx";
import EditableAvatar from "../components/EditableAvatar.tsx";

function ProfilePage() {
  const user = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);

  function stopEditing() {
    setIsEditing(false);
  }

  return (
    <section
      aria-label="Profile"
      className="relative flex h-full w-full flex-col items-center gap-2 overflow-y-auto border-line bg-panel px-6 py-12 text-center xl:max-w-2xl xl:border-r"
    >
      {!isEditing && (
        <button
          type="button"
          aria-label="Edit profile"
          onClick={() => {
            setIsEditing(true);
          }}
          className="absolute top-4 right-4 rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-brand"
        >
          Edit
        </button>
      )}
      {isEditing ? (
        <EditableAvatar user={user} />
      ) : (
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={user.avatarUrl}
          size="xl"
        />
      )}
      {isEditing ? (
        <EditProfileForm
          user={user}
          onCancel={stopEditing}
          onSaved={stopEditing}
        />
      ) : (
        <>
          <h1 className="mt-2 font-serif text-[22px] text-ink">
            {formatFullName(user)}
          </h1>
          <p className="text-base break-all text-muted">{user.email}</p>
        </>
      )}
    </section>
  );
}

export default ProfilePage;
