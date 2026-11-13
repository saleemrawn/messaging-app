import type { Request, Response } from "express";
import type { ApiResponse } from "../../types/api-types.ts";
import { matchedData, param, type ValidationError } from "express-validator";
import * as repository from "../repositories/message-repository.ts";
import type { Message } from "../../generated/prisma/client.ts";

const messageIdParamValidator = param("id")
  .trim()
  .notEmpty()
  .isInt()
  .withMessage("Invalid param message ID, expected number")
  .toInt();

const deleteMessageValidators = [messageIdParamValidator];

interface DeleteMessageReqParams {
  id: Message["id"];
}

interface DeleteMessageResBody {
  id: Message["id"];
  deletedAt: Message["deletedAt"];
}

const deleteMessage = async (
  req: Request<DeleteMessageReqParams, object, object, object>,
  res: Response<ApiResponse<DeleteMessageResBody, ValidationError[]>>,
) => {
  const { id }: DeleteMessageReqParams = matchedData(req);
  const message = await repository.deleteMessage(id);

  res.status(200).json({ success: true, data: message });
};

export { deleteMessage, deleteMessageValidators };
