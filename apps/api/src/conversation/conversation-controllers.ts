import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  Conversation,
  Message,
  MessageReceipt,
  UserAccount,
} from "../../generated/prisma/client.ts";
import type { MessageInput } from "../types/message-types.ts";
import type { User } from "../types/user-types.ts";
import { matchedData, type ValidationError } from "express-validator";
import * as repository from "./conversation-repository.ts";

interface MsgReceipt {
  id: MessageReceipt["id"];
  messageId: MessageReceipt["messageId"];
  userAccountId: MessageReceipt["userAccountId"];
  readAt: MessageReceipt["readAt"];
}

interface AddMessageToConversationReqParams {
  id: string;
}

interface AddMessageToConversationValidatedReq {
  id: Conversation["id"];
  content: Message["content"];
  senderId: UserAccount["id"];
  recipientId: UserAccount["id"];
}

interface GetConversationsByUserAccountIdReqBody {
  userAccountId: number;
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

interface GetConversationByIdReqParams {
  id: string;
}

interface GetConversationByIdValidatedReq {
  id: Conversation["id"];
}

interface GetConversationByIdResBody {
  id: Conversation["id"];
  updatedAt: Conversation["updatedAt"];
  messages: {
    id: Message["id"];
    content: Message["content"];
    createdAt: Message["createdAt"];
    userAccount: {
      id: UserAccount["id"];
      deletedAt: UserAccount["deletedAt"];
      user: {
        id: User["id"];
        firstName: User["firstName"];
        lastName: User["lastName"];
      };
    };
  }[];
}

interface AddMessageReceiptsReqParams {
  id: string;
}

interface AddMessageReceiptsReqBody {
  userAccountId: MessageReceipt["userAccountId"];
}

interface AddMessageReceiptsValidatedReq {
  id: Conversation["id"];
  userAccountId: MessageReceipt["userAccountId"];
}

interface DeleteConversationReqParams {
  id: string;
}

interface DeleteConversationValidatedReq {
  id: Conversation["id"];
}

type CreateConversationReqBody = Omit<MessageInput, "conversationId">;
type CreateConversationResBody = Pick<Conversation, "id">;
type DeleteConversationResBody = Pick<Conversation, "id" | "deletedAt">;
type AddMessageToConversationResBody = Pick<Conversation, "id">;
type AddMessageToConversationReqBody = Omit<MessageInput, "conversationId">;
type AddMessageReceiptsResBody = MsgReceipt[];

const getConversationsByUserAccountId = async (
  req: Request<object, object, GetConversationsByUserAccountIdReqBody, object>,
  res: Response<
    ApiResponse<GetConversationsByUserAccountIdResBody[], ValidationError[]>
  >,
) => {
  const { userAccountId }: GetConversationsByUserAccountIdReqBody =
    matchedData(req);

  const conversations =
    await repository.getConversationsByUserAccountId(userAccountId);

  res.status(200).json({ success: true, data: conversations });
};

const getConversationById = async (
  req: Request<GetConversationByIdReqParams, object, object, object>,
  res: Response<ApiResponse<GetConversationByIdResBody, ValidationError[]>>,
) => {
  const { id }: GetConversationByIdValidatedReq = matchedData(req);

  const conversation = await repository.getConversationById(id);
  if (!conversation) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return;
  }

  res.status(200).json({ success: true, data: conversation });
};

const createConversation = async (
  req: Request<object, object, CreateConversationReqBody, object>,
  res: Response<ApiResponse<CreateConversationResBody, ValidationError[]>>,
) => {
  const { content, senderId, recipientId }: CreateConversationReqBody =
    matchedData(req);

  const conversation = await repository.createConversation({
    content,
    senderId,
    recipientId,
  });

  res.status(201).json({ success: true, data: conversation });
};

const deleteConversation = async (
  req: Request<DeleteConversationReqParams, object, object, object>,
  res: Response<ApiResponse<DeleteConversationResBody, ValidationError[]>>,
) => {
  const { id }: DeleteConversationValidatedReq = matchedData(req);
  const conversation = await repository.deleteConversation(id);
  res.status(200).json({ success: true, data: conversation });
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
) => {
  const {
    id,
    content,
    senderId,
    recipientId,
  }: AddMessageToConversationValidatedReq = matchedData(req);

  const conversation = await repository.addMessageToConversation({
    conversationId: id,
    content,
    senderId,
    recipientId,
  });

  res.status(201).json({ success: true, data: conversation });
};

const addMessageReceipts = async (
  req: Request<
    AddMessageReceiptsReqParams,
    object,
    AddMessageReceiptsReqBody,
    object
  >,
  res: Response<ApiResponse<AddMessageReceiptsResBody, ValidationError[]>>,
) => {
  const { id, userAccountId }: AddMessageReceiptsValidatedReq =
    matchedData(req);

  const receipts = await repository.addMessageReceipts({
    conversationId: id,
    userAccountId,
  });

  res.status(201).json({ success: true, data: receipts });
};

export {
  getConversationsByUserAccountId,
  getConversationById,
  createConversation,
  deleteConversation,
  addMessageToConversation,
  addMessageReceipts,
};
