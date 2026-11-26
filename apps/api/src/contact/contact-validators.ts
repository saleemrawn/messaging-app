import { body, param } from "express-validator";

const contactIdBodyValidator = body("contactId")
  .trim()
  .notEmpty()
  .withMessage("contactId is required")
  .isInt()
  .withMessage("Invalid contactId, expected number")
  .toInt();

const contactIdParamValidator = param("contactId")
  .trim()
  .notEmpty()
  .withMessage("Contact ID is required")
  .isInt()
  .withMessage("Invalid contact ID, expected number")
  .toInt();

const addContactValidators = [contactIdBodyValidator];
const removeContactValidators = [contactIdParamValidator];

export { addContactValidators, removeContactValidators };
