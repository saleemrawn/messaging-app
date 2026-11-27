import { useEffect, useState } from "react";
import { useRevalidator } from "react-router";
import { isAxiosError } from "axios";
import type { Area } from "react-easy-crop";
import { parseApiError } from "../../shared/api/api-errors.ts";
import { showSuccessToast } from "../../shared/utils/toast.ts";
import type { User } from "../auth/types.ts";
import { removeAvatar, uploadAvatar } from "./avatar-service.ts";
import { avatarImageType, cropImage } from "./utils/crop-image.ts";
import { validateAvatarFile } from "./utils/validate-avatar-file.ts";

const GENERIC_ERROR_MESSAGE = "Something went wrong, please try again";
const PHOTO_UPDATED_MESSAGE = "Profile photo updated";
const PHOTO_REMOVED_MESSAGE = "Profile photo removed";

// The picked file and an object URL the cropper can display it from.
interface AvatarSource {
  file: File;
  url: string;
}

type AvatarUploadStatus = "idle" | "uploading" | "removing";

function toErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    return parseApiError(err).message ?? GENERIC_ERROR_MESSAGE;
  }
  return err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE;
}

// Drives the photo uploader: pick a file → crop → upload, or remove the
// current photo. onDone runs once the change is saved and the current user
// has been reloaded, so every avatar on screen already shows it. Success is
// confirmed with a toast after onDone has closed the dialog, since a toast
// can't show above a modal dialog; errors stay in the dialog.
function useAvatarUpload(userId: User["id"], onDone: () => void) {
  const { revalidate } = useRevalidator();
  const [source, setSource] = useState<AvatarSource | null>(null);
  const [status, setStatus] = useState<AvatarUploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();

  // Frees the previous preview when the file changes or the dialog closes.
  useEffect(() => {
    if (!source) return undefined;
    return () => {
      URL.revokeObjectURL(source.url);
    };
  }, [source]);

  function selectFile(file: File) {
    const problem = validateAvatarFile(file);
    setError(problem ?? undefined);
    if (problem) return;
    setSource({ file, url: URL.createObjectURL(file) });
  }

  function clearSource() {
    setSource(null);
    setError(undefined);
  }

  async function runChange(
    nextStatus: AvatarUploadStatus,
    change: () => Promise<void>,
    successMessage: string,
  ) {
    setStatus(nextStatus);
    setError(undefined);
    try {
      await change();
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      setStatus("idle");
      return;
    }
    await revalidate();
    onDone();
    showSuccessToast(successMessage);
  }

  async function save(area: Area) {
    if (!source) return;
    const type = avatarImageType(source.file.type);
    const fileName = type === "image/png" ? "avatar.png" : "avatar.jpg";
    setProgress(0);
    await runChange(
      "uploading",
      async () => {
        const image = await cropImage(source.url, area, type);
        await uploadAvatar(userId, image, fileName, setProgress);
      },
      PHOTO_UPDATED_MESSAGE,
    );
  }

  async function remove() {
    await runChange(
      "removing",
      () => removeAvatar(userId),
      PHOTO_REMOVED_MESSAGE,
    );
  }

  return {
    source,
    status,
    progress,
    error,
    isBusy: status !== "idle",
    selectFile,
    clearSource,
    save,
    remove,
  };
}

export { useAvatarUpload };
