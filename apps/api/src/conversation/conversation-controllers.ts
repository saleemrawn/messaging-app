import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  AddMessageToConversationReqParams,
  AddMessageToConversationValidatedReq,
  GetConversationsByUserAccountIdResBody,
  GetArchivedConversationsResBody,
  GetUnreadCountResBody,
  GetConversationByIdReqParams,
  GetConversationByIdValidatedReq,
  GetConversationByIdResBody,
  AddMessageReceiptsReqParams,
  AddMessageReceiptsValidatedReq,
  DeleteConversationReqParams,
  DeleteConversationResBody,
  DeleteConversationValidatedReq,
  UnarchiveConversationReqParams,
  UnarchiveConversationResBody,
  UnarchiveConversationValidatedReq,
  CreateConversationReqBody,
  CreateConversationValidatedReq,
  CreateConversationResBody,
  AddMessageToConversationReqBody,
  AddMessageToConversationResBody,
  AddMessageReceiptsResBody,
} from "../types/conversation-types.ts";
import { matchedData, type ValidationError } from "express-validator";
import { getAuthenticatedUserAccountId } from "../auth/auth-helpers.ts";
import * as repository from "./conversation-repository.ts";
import * as userRepository from "../user/user-repository.ts";

const CONVERSATION_NOT_FOUND = {
  success: false,
  message: "Conversation not found",
} as const;

const getConversationsByUserAccountId = async (
  req: Request,
  res: Response<
    ApiResponse<GetConversationsByUserAccountIdResBody, ValidationError[]>
  >,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  const conversations = await repository.getConversationsByUserAccountId(
    userAccountId,
    { isArchived: false },
  );

  res.status(200).json({ success: true, data: conversations });
};

const getArchivedConversations = async (
  req: Request,
  res: Response<
    ApiResponse<GetArchivedConversationsResBody, ValidationError[]>
  >,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  const conversations = await repository.getConversationsByUserAccountId(
    userAccountId,
    { isArchived: true },
  );

  res.status(200).json({ success: true, data: conversations });
};

const getUnreadCount = async (
  req: Request,
  res: Response<ApiResponse<GetUnreadCountResBody, ValidationError[]>>,
) => {
  const userAccountId = getAuthenticatedUserAccountId(req);
  const unreadCount =
    await repository.getUnreadCountByUserAccountId(userAccountId);

  res.status(200).json({ success: true, data: { unreadCount } });
};

const getConversationById = async (
  req: Request<GetConversationByIdReqParams, object, object, object>,
  res: Response<ApiResponse<GetConversationByIdResBody, ValidationError[]>>,
) => {
  const { id }: GetConversationByIdValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserAccountId(req);

  const conversation = await repository.getConversationById(id, userAccountId);
  if (!conversation) {
    res.status(404).json(CONVERSATION_NOT_FOUND);
    return;
  }

  res.status(200).json({ success: true, data: conversation });
};

// Get-or-create: answers 201 for a new conversation and 200 with the existing
// one when the caller already shares a conversation with the recipient.
const createConversation = async (
  req: Request<object, object, CreateConversationReqBody, object>,
  res: Response<ApiResponse<CreateConversationResBody, ValidationError[]>>,
) => {
  const { content, recipientId }: CreateConversationValidatedReq =
    matchedData(req);
  const senderId = getAuthenticatedUserAccountId(req);

  if (recipientId === senderId) {
    res.status(400).json({
      success: false,
      message: "You can't start a conversation with yourself",
    });
    return;
  }

  if (!(await userRepository.getUserByAccountId(recipientId))) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  const { id, isCreated } = await repository.findOrCreateConversation({
    senderId,
    recipientId,
    content,
  });

  res.status(isCreated ? 201 : 200).json({ success: true, data: { id } });
};

const deleteConversation = async (
  req: Request<DeleteConversationReqParams, object, object, object>,
  res: Response<ApiResponse<DeleteConversationResBody, ValidationError[]>>,
) => {
  const { id }: DeleteConversationValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserAccountId(req);

  if (!(await repository.deleteConversation(id, userAccountId))) {
    res.status(404).json(CONVERSATION_NOT_FOUND);
    return;
  }

  res.status(200).json({ success: true, data: { id } });
};

const unarchiveConversation = async (
  req: Request<UnarchiveConversationReqParams, object, object, object>,
  res: Response<ApiResponse<UnarchiveConversationResBody, ValidationError[]>>,
) => {
  const { id }: UnarchiveConversationValidatedReq = matchedData(req);
  const userAccountId = getAuthenticatedUserAccountId(req);

  if (!(await repository.unarchiveConversation(id, userAccountId))) {
    res.status(404).json(CONVERSATION_NOT_FOUND);
    return;
  }

  res.status(200).json({ success: true, data: { id } });
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
  const senderId = getAuthenticatedUserAccountId(req);

  if (!(await repository.isConversationMember(id, senderId))) {
    res.status(404).json(CONVERSATION_NOT_FOUND);
    return;
  }

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
  const userAccountId = getAuthenticatedUserAccountId(req);

  if (!(await repository.isConversationMember(id, userAccountId))) {
    res.status(404).json(CONVERSATION_NOT_FOUND);
    return;
  }

  const receipts = await repository.addMessageReceipts({
    conversationId: id,
    userAccountId,
  });

  res.status(201).json({ success: true, data: receipts });
};

export {
  getConversationsByUserAccountId,
  getArchivedConversations,
  getUnreadCount,
  getConversationById,
  createConversation,
  deleteConversation,
  addMessageToConversation,
  addMessageReceipts,
  unarchiveConversation,
};
