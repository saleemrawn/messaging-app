interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserAccount extends User {
  username: string;
  password: string;
}

export type { User, UserAccount };
