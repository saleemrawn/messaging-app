import { api } from "../../shared/api/client.ts";
import type { ApiResponse } from "../../shared/api/types.ts";
import type { User } from "../auth/types.ts";

const PERCENT = 100;

// Uploads the cropped photo as multipart "avatar", reporting progress as a
// whole percentage when the browser knows the total size.
async function uploadAvatar(
  userId: User["id"],
  image: Blob,
  fileName: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("avatar", image, fileName);

  await api.put<ApiResponse<User>, FormData>(
    `/users/${String(userId)}/avatar`,
    formData,
    {
      onUploadProgress: ({ loaded, total }) => {
        if (total) onProgress?.(Math.round((loaded / total) * PERCENT));
      },
    },
  );
}

async function removeAvatar(userId: User["id"]): Promise<void> {
  await api.delete<ApiResponse<User>>(`/users/${String(userId)}/avatar`);
}

export { uploadAvatar, removeAvatar };
