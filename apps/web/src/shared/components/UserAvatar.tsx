type AvatarSize = "md" | "lg";

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  md: "size-12",
  lg: "size-24 text-3xl",
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Initials placeholder until users can upload a photo. Hidden from assistive
// tech because the full name is always shown next to it.
function UserAvatar({ firstName, lastName, size = "md" }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700`}
    >
      {getInitials(firstName, lastName)}
    </span>
  );
}

export default UserAvatar;
