import multer, { MulterError } from "multer";
import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.ts";
import { UNSUPPORTED_IMAGE_MESSAGE } from "./avatar-processing.ts";

const AVATAR_FIELD_NAME = "avatar";
const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

// Kept in memory: the file is re-encoded before anything is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new HttpError(400, UNSUPPORTED_IMAGE_MESSAGE));
  },
}).single(AVATAR_FIELD_NAME);

function toHttpError(err: unknown): unknown {
  if (!(err instanceof MulterError)) return err;
  if (err.code === "LIMIT_FILE_SIZE") {
    return new HttpError(413, "Image must be 4 MB or smaller");
  }
  return new HttpError(400, `Upload one image in the "avatar" field`);
}

// Parses a single "avatar" file into req.file, mapping multer's errors to
// HTTP errors the error middleware can report.
const parseAvatarUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (err: unknown) => {
    if (err) {
      next(toHttpError(err));
      return;
    }
    if (!req.file) {
      next(new HttpError(400, "Choose an image to upload"));
      return;
    }
    next();
  });
};

export { parseAvatarUpload, AVATAR_MAX_BYTES };
