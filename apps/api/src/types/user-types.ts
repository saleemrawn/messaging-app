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

interface UpdateUserReqBody {
  firstName: User["firstName"];
  lastName: User["lastName"];
  email: User["email"];
}

interface UpdateUserValidatedReq {
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
  UpdateUserReqParams,
  UpdateUserReqBody,
  UpdateUserValidatedReq,
  DeleteUserReqParams,
  DeleteUserValidatedReq,
};
