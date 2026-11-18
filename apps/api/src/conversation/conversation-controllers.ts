import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  AddMessageToConversationReqParams,
  AddMessageToConversationValidatedReq,
  GetConversationsByUserAccountIdResBody,
  GetConversationByIdReqParams,
  GetConversationByIdValidatedReq,
  GetConversationByIdResBody,
  AddMessageReceiptsReqParams,
  AddMessageReceiptsValidatedReq,
  DeleteConversationReqParams,
  DeleteConversationResBody,
  DeleteConversationValidatedReq,
  CreateConversationReqBody,
  CreateConversationResBody,
  AddMessageToConversationReqBody,
  AddMessageToConversationResBody,
  AddMessageReceiptsResBody,
} from "../types/conversation-types.ts";
import { matchedData, type ValidationError } from "express-validator";
import { getAuthenticatedUserId } from "../user/user-helpers.ts";
import * as repository from "./conversation-repository.ts";

const getConversationsByUserAccountId = async (
  req: Request,
  res: Response<
    ApiResponse<GetConversationsByUserAccountIdResBody, ValidationError[]>
  >,
) => {
  const userAccountId = getAuthenticatedUserId(req);
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
  const { content, recipientId }: CreateConversationReqBody = matchedData(req);
  const senderId = getAuthenticatedUserId(req);

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
  const { id, content, recipientId }: AddMessageToConversationValidatedReq =
    matchedData(req);
  const senderId = getAuthenticatedUserId(req);

  const conversation = await repository.addMessageToConversation({
    conversationId: id,
    content,
    senderId,
    recipientId,
  });

  res.status(201).json({ success: true, data: conversation });
};

const addMessageReceipts = async (
  req: Request<AddMessageReceiptsReqParams>,
  res: Response<ApiResponse<AddMessageReceiptsResBody, ValidationError[]>>,
) => {
  const { id }: AddMessageReceiptsValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserId(req);

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
