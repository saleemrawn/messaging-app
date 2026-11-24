interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
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

export type { User, LoginCredentials, SignupDetails };
