import { body, param } from "express-validator";

const intBodyValidator = (field: string) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isInt()
    .withMessage(`Invalid ${field}, expected number`)
    .toInt();
};

const recipientIdValidator = intBodyValidator("recipientId");

const conversationIdValidator = param("id")
  .trim()
  .notEmpty()
  .withMessage("Conversation ID is required")
  .isInt()
  .withMessage("Invalid conversation ID, expected number")
  .toInt();

const contentValidator = body("content")
  .trim()
  .notEmpty()
  .withMessage("Message required")
  .isLength({ min: 1, max: 5000 })
  .withMessage("Message must be between 1 and 5,000 characters");

const getConversationByIdValidators = [conversationIdValidator];
const deleteConversationValidators = [conversationIdValidator];
const addMessageReceiptsValidators = [conversationIdValidator];

const createConversationValidators = [contentValidator, recipientIdValidator];

const addMessageToConversationValidators = [
  conversationIdValidator,
  contentValidator,
  recipientIdValidator,
];

export {
  getConversationByIdValidators,
  deleteConversationValidators,
  createConversationValidators,
  addMessageToConversationValidators,
  addMessageReceiptsValidators,
};
