import { body, param, query, type Meta } from "express-validator";

const PASSWORD_STRENGTH_MESSAGE =
  "Passwords must at least 8 characters long and contain an uppercase letter, number and symbol";
const PASSWORD_CHANGE_FIELDS = [
  "currentPassword",
  "newPassword",
  "confirmNewPassword",
] as const;

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

// Exact, full-address match only; normalizeEmail() is avoided because it
// rewrites addresses (e.g. strips dots from Gmail local parts).
const emailQueryValidator = query("email")
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
  .withMessage(PASSWORD_STRENGTH_MESSAGE);

const bodyField = (req: Meta["req"], name: string): unknown =>
  (req.body as Record<string, unknown> | undefined)?.[name];

// Filling in any password field means the user wants to change it, so all
// three become required. All blank leaves the password unchanged.
const isChangingPassword = (_value: unknown, { req }: Meta): boolean =>
  PASSWORD_CHANGE_FIELDS.some((name) => {
    const value = bodyField(req, name);
    return value !== undefined && value !== null && value !== "";
  });

const currentPasswordValidator = body("currentPassword")
  .if(isChangingPassword)
  .notEmpty()
  .withMessage("Current password is required")
  .bail()
  .isString()
  .withMessage("Current password is required");

const newPasswordValidator = body("newPassword")
  .if(isChangingPassword)
  .notEmpty()
  .withMessage("New password is required")
  .bail()
  .isStrongPassword()
  .withMessage(PASSWORD_STRENGTH_MESSAGE);

const confirmNewPasswordValidator = body("confirmNewPassword")
  .if(isChangingPassword)
  .notEmpty()
  .withMessage("Please confirm your new password")
  .bail()
  .custom((value, { req }) => value === bodyField(req, "newPassword"))
  .withMessage("Passwords do not match");

const getUserByIdValidators = [idValidator];

const lookupUserValidators = [emailQueryValidator];

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
  currentPasswordValidator,
  newPasswordValidator,
  confirmNewPasswordValidator,
];

const deleteUserValidators = [idValidator];

export {
  getUserByIdValidators,
  lookupUserValidators,
  createUserValidators,
  updateUserValidators,
  deleteUserValidators,
};
