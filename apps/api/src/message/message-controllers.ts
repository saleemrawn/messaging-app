import type { Request, Response } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import type {
  DeleteMessageReqParams,
  DeleteMessageResBody,
} from "../types/message-types.ts";
import { matchedData, type ValidationError } from "express-validator";
import * as repository from "./message-repository.ts";

const deleteMessage = async (
  req: Request<DeleteMessageReqParams, object, object, object>,
  res: Response<ApiResponse<DeleteMessageResBody, ValidationError[]>>,
) => {
  const { id }: DeleteMessageReqParams = matchedData(req);
  const message = await repository.deleteMessage(id);

  res.status(200).json({ success: true, data: message });
};

export { deleteMessage };
