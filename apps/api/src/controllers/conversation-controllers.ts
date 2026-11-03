import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../../types/api-types.ts";
import type { Conversation } from "../../generated/prisma/client.ts";
import type { MessageInput } from "../../types/message-types.ts";
import {
  body,
  validationResult,
  matchedData,
  param,
  type ValidationError,
} from "express-validator";
import * as repository from "../repositories/conversation-repository.ts";

const conversationIdValidator = param("id")
  .trim()
  .notEmpty()
  .isInt()
  .withMessage("Invalid conversation ID, expected number")
  .toInt();

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

const addMessageToConversationValidators = [
  conversationIdValidator,
  contentValidator,
  senderIdValidator,
  recipientIdValidator,
];

type CreateConversationReqBody = Omit<MessageInput, "conversationId">;
type CreateConversationResBody = Pick<Conversation, "id">;
type AddMessageToConversationResBody = Pick<Conversation, "id">;
type AddMessageToConversationReqBody = Omit<MessageInput, "conversationId">;
interface AddMessageToConversationReqParams {
  id: string;
}

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

const addMessageToConversation = async (
  req: Request<
    AddMessageToConversationReqParams,
    object,
    AddMessageToConversationReqBody,
    object
  >,
  res: Response<
    ApiResponse<AddMessageToConversationResBody, ValidationError[]>
  >,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      id,
      content,
      senderId,
      recipientId,
    }: {
      id: number;
      content: string;
      senderId: number;
      recipientId: number;
    } = matchedData(req);

    const conversation = await repository.addMessageToConversation({
      conversationId: id,
      content,
      senderId,
      recipientId,
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

export {
  createConversation,
  addMessageToConversation,
  createConversationValidators,
  addMessageToConversationValidators,
};
