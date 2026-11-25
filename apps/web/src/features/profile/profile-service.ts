import { api } from "../../shared/api/client.ts";
import type { ApiResponse } from "../../shared/api/types.ts";
import type { User } from "../auth/types.ts";
import type { ProfileUpdate } from "./types.ts";

async function updateProfile(
  userId: User["id"],
  details: ProfileUpdate,
): Promise<void> {
  await api.put<ApiResponse<User>, ProfileUpdate>(
    `/users/${String(userId)}`,
    details,
  );
}

export { updateProfile };
