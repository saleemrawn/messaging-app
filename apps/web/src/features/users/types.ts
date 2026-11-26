// Another user as found by email: enough to show and pick them, nothing more.
interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export type { UserSummary };
