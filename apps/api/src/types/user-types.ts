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

interface UserResBody {
  id: UserAccount["id"];
  username: UserAccount["username"];
  firstName: User["firstName"];
  lastName: User["lastName"];
  email: User["email"];
}

interface GetUserByIdReqParams {
  id: UserAccount["id"];
}

interface GetUserByIdValidatedReq {
  id: UserAccount["id"];
}

interface LookupUserReqQuery {
  email: string;
}

interface LookupUserValidatedReq {
  email: User["email"];
}

// Deliberately minimal: what's needed to pick a recipient, nothing more.
type LookupUserResBody = User;

interface CreateUserReqBody {
  firstName: UserAccount["firstName"];
  lastName: UserAccount["lastName"];
  email: UserAccount["email"];
  username: UserAccount["username"];
  password: UserAccount["password"];
}

interface CreateUserValidatedData {
  firstName: UserAccount["firstName"];
  lastName: UserAccount["lastName"];
  email: UserAccount["email"];
  username: UserAccount["username"];
  password: UserAccount["password"];
}

interface UpdateUserReqParams {
  id: UserAccount["id"];
}

// The password fields are optional: all blank leaves the password unchanged.
interface PasswordChangeFields {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

interface UpdateUserReqBody extends PasswordChangeFields {
  firstName: User["firstName"];
  lastName: User["lastName"];
  email: User["email"];
}

interface UpdateUserValidatedReq extends PasswordChangeFields {
  id: UserAccount["id"];
  firstName: User["firstName"];
  lastName: User["lastName"];
  email: User["email"];
}

interface DeleteUserReqParams {
  id: UserAccount["id"];
}

interface DeleteUserValidatedReq {
  id: UserAccount["id"];
}

export type {
  User,
  UserAccount,
  UserResBody,
  CreateUserReqBody,
  CreateUserValidatedData,
  GetUserByIdReqParams,
  GetUserByIdValidatedReq,
  LookupUserReqQuery,
  LookupUserValidatedReq,
  LookupUserResBody,
  UpdateUserReqParams,
  UpdateUserReqBody,
  UpdateUserValidatedReq,
  DeleteUserReqParams,
  DeleteUserValidatedReq,
};
