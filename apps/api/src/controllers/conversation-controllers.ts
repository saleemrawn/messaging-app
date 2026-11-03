import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../../types/api-types.ts";
import type { Conversation } from "../../generated/prisma/client.ts";
import type { MessageInput } from "../../types/message-types.ts";
import {
  body,
  validationResult,
  matchedData,
  type ValidationError,
} from "express-validator";
import * as repository from "../repositories/conversation-repository.ts";

const contentValidator = body("content")
  .trim()
  .notEmpty()
  .withMessage("Message content required");

const senderIdValidator = body("senderId")
  .trim()
  .notEmpty()
  .withMessage("Sender ID is required")
  .isInt()
  .withMessage("Invalid sender ID, expected number")
  .toInt();

const recipientIdValidator = body("recipientId")
  .trim()
  .notEmpty()
  .withMessage("Recipient ID is required")
  .isInt()
  .withMessage("Invalid recipient ID, expected number")
  .toInt();

const createConversationValidators = [
  contentValidator,
  senderIdValidator,
  recipientIdValidator,
];

type CreateConversationReqBody = Omit<MessageInput, "conversationId">;
type CreateConversationResBody = Pick<Conversation, "id">;

const createConversation = async (
  req: Request<object, object, CreateConversationReqBody, object>,
  res: Response<ApiResponse<CreateConversationResBody, ValidationError[]>>,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { content, senderId, recipientId }: CreateConversationReqBody =
      matchedData(req);

    const conversation = await repository.createConversation({
      content,
      senderId,
      recipientId,
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

export { createConversation, createConversationValidators };
