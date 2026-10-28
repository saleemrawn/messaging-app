interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface UserAccount extends User {
  username: string;
  password: string;
}

export type { User, UserAccount };
