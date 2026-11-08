import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../../types/api-types.ts";
import type {
  Conversation,
  Message,
  UserAccount,
} from "../../generated/prisma/client.ts";
import type { MessageInput } from "../../types/message-types.ts";
import {
  body,
  validationResult,
  matchedData,
  param,
  type ValidationError,
} from "express-validator";
import * as repository from "../repositories/conversation-repository.ts";
import type { User } from "../../types/user-types.ts";

const userAccountIdValidator = body("id")
  .trim()
  .notEmpty()
  .withMessage("User account ID is required")
  .isInt()
  .withMessage("Invalid user account ID, expected number")
  .toInt();

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

const getConversationsByUserAccountIdValidators = [userAccountIdValidator];

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
interface GetConversationsByUserAccountIdReqBody {
  id: number;
}
interface GetConversationsByUserAccountIdResBody {
  id: Conversation["id"];
  updatedAt: Conversation["updatedAt"];
  messages: {
    id: Message["id"];
    content: Message["content"];
    createdAt: Message["createdAt"];
  }[];
  userConversations: {
    userAccount: {
      id: UserAccount["id"];
      deletedAt: UserAccount["deletedAt"];
      user: {
        firstName: User["firstName"];
        lastName: User["lastName"];
      };
    };
  }[];
}

const getConversationsByUserAccountId = async (
  req: Request<object, object, GetConversationsByUserAccountIdReqBody, object>,
  res: Response<
    ApiResponse<GetConversationsByUserAccountIdResBody[], ValidationError[]>
  >,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { id }: GetConversationsByUserAccountIdReqBody = matchedData(req);

    const conversations = await repository.getConversationsByUserAccountId(id);

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

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
  getConversationsByUserAccountId,
  createConversation,
  addMessageToConversation,
  getConversationsByUserAccountIdValidators,
  createConversationValidators,
  addMessageToConversationValidators,
};
