import type { Area } from "react-easy-crop";
import { AVATAR_SIZE_PX } from "./validate-avatar-file.ts";

type AvatarImageType = "image/jpeg" | "image/png";

const JPEG_QUALITY = 0.9;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error("Couldn't read that image"));
    };
    image.src = src;
  });
}

// PNGs stay PNG to keep transparency; everything else becomes JPEG.
function avatarImageType(sourceType: string): AvatarImageType {
  return sourceType === "image/png" ? "image/png" : "image/jpeg";
}

// Draws the cropped area of the image at `src` onto a 320×320 canvas, so the
// upload is always square and no bigger than needed.
async function cropImage(
  src: string,
  area: Area,
  type: AvatarImageType,
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE_PX;
  canvas.height = AVATAR_SIZE_PX;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can't crop images");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    AVATAR_SIZE_PX,
    AVATAR_SIZE_PX,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Couldn't crop that image"));
      },
      type,
      JPEG_QUALITY,
    );
  });
}

export { cropImage, avatarImageType };
export type { AvatarImageType };
