import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  DeleteMessageReqParams,
  DeleteMessageResBody,
} from "../types/message-types.ts";
import { matchedData, type ValidationError } from "express-validator";
import { getAuthenticatedUserId } from "../auth/auth-helpers.ts";
import * as repository from "./message-repository.ts";

const deleteMessage = async (
  req: Request<DeleteMessageReqParams, object, object, object>,
  res: Response<ApiResponse<DeleteMessageResBody, ValidationError[]>>,
) => {
  const { id }: DeleteMessageReqParams = matchedData(req);
  const userAccountId = getAuthenticatedUserId(req);

  const message = await repository.deleteMessage({ id, userAccountId });
  if (!message) {
    res.status(404).json({ success: false, message: "Message not found" });
    return;
  }
  res.status(200).json({ success: true, data: message });
};

export { deleteMessage };
