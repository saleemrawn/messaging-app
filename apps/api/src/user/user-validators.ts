import { body, param } from "express-validator";

const idValidator = param("id")
  .trim()
  .optional()
  .isInt()
  .withMessage("Invalid user ID, expected number")
  .toInt();

const firstNameValidator = body("firstName")
  .trim()
  .notEmpty()
  .withMessage("First name required")
  .isAlpha()
  .withMessage("First name should only contain letters");

const lastNameValidator = body("lastName")
  .trim()
  .notEmpty()
  .withMessage("Last name required")
  .isAlpha()
  .withMessage("Last name should only contain letters");

const emailValidator = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Email must be a valid format");

const usernameValidator = body("username")
  .trim()
  .notEmpty()
  .withMessage("Username is required")
  .isLength({ min: 3, max: 30 })
  .withMessage("Username must be between 3 and 30 characters long")
  .isAlphanumeric(undefined, { ignore: "_-." })
  .withMessage(
    "Username must contain only letters, numbers, hyphen (-), underscore (_) or period (.)",
  );

const passwordValidator = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isStrongPassword()
  .withMessage(
    "Passwords must at least 8 characters long and contain an uppercase letter, number and symbol",
  );

const getUserByIdValidators = [idValidator];

const createUserValidators = [
  firstNameValidator,
  lastNameValidator,
  emailValidator,
  usernameValidator,
  passwordValidator,
];

const updateUserValidators = [
  idValidator,
  firstNameValidator,
  lastNameValidator,
  emailValidator,
];

const deleteUserValidators = [idValidator];

export {
  getUserByIdValidators,
  createUserValidators,
  updateUserValidators,
  deleteUserValidators,
};
