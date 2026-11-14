import { param } from "express-validator";

const messageIdParamValidator = param("id")
  .trim()
  .notEmpty()
  .isInt()
  .withMessage("Invalid param message ID, expected number")
  .toInt();

const deleteMessageValidators = [messageIdParamValidator];

export { deleteMessageValidators };
