import { api } from "../../shared/api/client.ts";
import type { ApiResponse } from "../../shared/api/types.ts";
import type { UserSummary } from "./types.ts";

// The user with this exact email address. Rejects with a 404 when there is no
// such user, or when it's the caller's own address.
async function findUserByEmail(email: string): Promise<UserSummary> {
  const res = await api.get<ApiResponse<UserSummary>>("/users/lookup", {
    params: { email },
  });
  if (!res.data.success || !res.data.data) {
    throw new Error("User lookup returned no user");
  }
  return res.data.data;
}

export { findUserByEmail };
