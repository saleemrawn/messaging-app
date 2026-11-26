import { createHash } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { HttpError } from "../lib/http-error.ts";
import { AVATAR_HASH_LENGTH, type AvatarExtension } from "./avatar-keys.ts";

const AVATAR_SIZE_PX = 320;
// Refuses images that decode to more pixels than this (a small file can
// expand to a huge bitmap). 8000 × 8000 is far beyond any real profile photo.
const MAX_INPUT_PIXELS = 8000 * 8000;
const JPEG_QUALITY = 85;

const UNSUPPORTED_IMAGE_MESSAGE = "Image must be a JPG or PNG file";
const NOT_SQUARE_MESSAGE = "Image must be square (1:1)";

interface ProcessedAvatar {
  data: Buffer;
  extension: AvatarExtension;
  contentType: string;
  // Hex fingerprint of `data`, used in the storage key.
  hash: string;
}

type SupportedFormat = "jpeg" | "png";

const FORMAT_OUTPUT: Record<
  SupportedFormat,
  { extension: AvatarExtension; contentType: string }
> = {
  jpeg: { extension: "jpg", contentType: "image/jpeg" },
  png: { extension: "png", contentType: "image/png" },
};

function isSupportedFormat(format: unknown): format is SupportedFormat {
  return format === "jpeg" || format === "png";
}

async function readMetadata(buffer: Buffer): Promise<Metadata> {
  try {
    return await sharp(buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch (_err: unknown) {
    // Not an image sharp can decode, or one over the pixel limit.
    throw new HttpError(400, UNSUPPORTED_IMAGE_MESSAGE);
  }
}

// Checks the upload really is a square JPEG or PNG (by its content, not its
// declared type), then re-encodes it at 320×320. Re-encoding drops EXIF data
// such as GPS location and anything smuggled alongside the image data.
async function processAvatar(buffer: Buffer): Promise<ProcessedAvatar> {
  const { format, width, height } = await readMetadata(buffer);

  // Checked here too, so an oversized image is a 400 rather than a failure
  // during the resize below.
  if (!isSupportedFormat(format) || width * height > MAX_INPUT_PIXELS) {
    throw new HttpError(400, UNSUPPORTED_IMAGE_MESSAGE);
  }
  // A square stays square under EXIF rotation, so the raw size is enough.
  if (width !== height) {
    throw new HttpError(400, NOT_SQUARE_MESSAGE);
  }

  const pipeline = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: "cover" });

  const data = await (format === "jpeg"
    ? pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    : pipeline.png({ compressionLevel: 9 })
  ).toBuffer();

  const hash = createHash("sha256")
    .update(data)
    .digest("hex")
    .slice(0, AVATAR_HASH_LENGTH);

  return { data, hash, ...FORMAT_OUTPUT[format] };
}

export { processAvatar, AVATAR_SIZE_PX, UNSUPPORTED_IMAGE_MESSAGE };
export type { ProcessedAvatar };
