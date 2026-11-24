interface UserAvatarProps {
  firstName: string;
  lastName: string;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Initials placeholder until users can upload a photo. Hidden from assistive
// tech because the full name is always shown next to it.
function UserAvatar({ firstName, lastName }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700"
    >
      {getInitials(firstName, lastName)}
    </span>
  );
}

export default UserAvatar;
