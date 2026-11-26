import { param } from "express-validator";
import { AVATAR_FILE_NAME_PATTERN } from "./avatar-keys.ts";

const userIdValidator = param("id")
  .trim()
  .isInt({ min: 1 })
  .withMessage("Invalid user ID, expected number")
  .toInt();

// Only seed files and hashed uploads; also rules out path traversal.
const fileNameValidator = param("fileName")
  .matches(AVATAR_FILE_NAME_PATTERN)
  .withMessage("Invalid avatar file name");

const userAvatarValidators = [userIdValidator];

const getAvatarValidators = [fileNameValidator];

export { userAvatarValidators, getAvatarValidators };
