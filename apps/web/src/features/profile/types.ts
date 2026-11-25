// Leaving all three password fields blank keeps the current password.
interface ProfileUpdate {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type { ProfileUpdate };
