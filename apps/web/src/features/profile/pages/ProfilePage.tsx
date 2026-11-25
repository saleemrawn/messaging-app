import { useCurrentUser } from "../../auth/use-current-user.ts";
import UserAvatar from "../../../shared/components/UserAvatar.tsx";
import { formatFullName } from "../../../shared/utils/full-name.ts";

function ProfilePage() {
  const user = useCurrentUser();

  return (
    <section
      aria-label="Profile"
      className="flex h-dvh w-full max-w-2xl flex-col items-center gap-2 border-r border-gray-200 bg-white px-6 py-12 text-center"
    >
      <UserAvatar
        firstName={user.firstName}
        lastName={user.lastName}
        size="lg"
      />
      <h1 className="mt-2 text-xl font-semibold text-gray-900">
        {formatFullName(user)}
      </h1>
      <p className="text-base break-all text-gray-500">{user.email}</p>
    </section>
  );
}

export default ProfilePage;
