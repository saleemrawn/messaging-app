import { isAxiosError } from "axios";
import { api } from "../../adapters/api.ts";
import type {
  ApiResponse,
  LoginCredentials,
  SignupDetails,
  User,
} from "../types/api.ts";

const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;

function isUnauthorizedError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === HTTP_UNAUTHORIZED;
}

function isLoggedOutError(error: unknown): boolean {
  return (
    isUnauthorizedError(error) ||
    (isAxiosError(error) && error.response?.status === HTTP_NOT_FOUND)
  );
}

// Returns null when there is no valid session; rethrows anything else so the
// router's error page shows it instead of silently treating it as logged out.
async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data.success ? (res.data.data ?? null) : null;
  } catch (error: unknown) {
    if (isLoggedOutError(error)) return null;
    throw error;
  }
}

async function login(credentials: LoginCredentials): Promise<void> {
  await api.post<ApiResponse<never>, LoginCredentials>(
    "/auth/login",
    credentials,
  );
}

// The token cookie is httpOnly, so only the API can clear it.
async function logout(): Promise<void> {
  await api.post<ApiResponse<never>>("/auth/logout");
}

async function signup(details: SignupDetails): Promise<void> {
  await api.post<ApiResponse<User>, SignupDetails>("/users", details);
}

export { getCurrentUser, isUnauthorizedError, login, logout, signup };
