interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ConversationRecipient {
  id: number;
  firstName: string;
  lastName: string;
}

interface LatestMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
}

interface ConversationSummary {
  id: number;
  updatedAt: string;
  unreadCount: number;
  recipient: ConversationRecipient;
  latestMessage: LatestMessage | null;
}

interface SuccessResponse<Data> {
  success: true;
  message?: string;
  data?: Data;
}

interface FieldValidationError {
  type: "field";
  path: string;
  msg: string;
}

interface ErrorResponse {
  success: false;
  message?: string;
  errors?: FieldValidationError[];
}

type ApiResponse<Data> = SuccessResponse<Data> | ErrorResponse;

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupDetails extends LoginCredentials {
  firstName: string;
  lastName: string;
  email: string;
}

export type {
  User,
  ConversationRecipient,
  ConversationSummary,
  LatestMessage,
  ApiResponse,
  ErrorResponse,
  FieldValidationError,
  LoginCredentials,
  SignupDetails,
};
