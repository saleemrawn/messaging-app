import { useState } from "react";
import { toApiUrl } from "../api/api-url.ts";

type AvatarSize = "md" | "lg" | "xl";

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  // Relative to the API base; null (or a photo that fails to load) shows
  // initials instead.
  avatarUrl?: string | null;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  md: "size-12",
  lg: "size-24 text-3xl",
  xl: "size-32 text-4xl",
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Hidden from assistive tech because the full name is always shown next to it.
function UserAvatar({
  firstName,
  lastName,
  avatarUrl = null,
  size = "md",
}: UserAvatarProps) {
  // Remembers which URL failed, so a new photo gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isShowingPhoto = avatarUrl !== null && avatarUrl !== failedUrl;

  return (
    <span
      aria-hidden="true"
      className={`flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-700`}
    >
      {isShowingPhoto ? (
        <img
          src={toApiUrl(avatarUrl)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => {
            setFailedUrl(avatarUrl);
          }}
          className="size-full object-cover"
        />
      ) : (
        getInitials(firstName, lastName)
      )}
    </span>
  );
}

export default UserAvatar;
