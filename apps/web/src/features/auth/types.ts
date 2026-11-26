interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  // Relative to the API base; null shows initials.
  avatarUrl: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupDetails extends LoginCredentials {
  firstName: string;
  lastName: string;
  email: string;
}

// Which form the /login page shows.
type AuthMode = "signup" | "login";

// Router navigation state for /login, e.g. to open on the login form after logout.
interface LoginPageState {
  mode: AuthMode;
}

export type { User, LoginCredentials, SignupDetails, AuthMode, LoginPageState };
