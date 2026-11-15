import type {
  Conversation,
  Message,
  MessageReceipt,
  UserAccount,
} from "../../generated/prisma/client.ts";
import type { MessageInput } from "../types/message-types.ts";
import * as repository from "../conversation/conversation-repository.ts";

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

interface GetConversationByIdReqParams {
  id: string;
}

interface GetConversationByIdValidatedReq {
  id: Conversation["id"];
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

type GetConversationsByUserAccountIdResBody = Awaited<
  ReturnType<typeof repository.getConversationsByUserAccountId>
>;

type GetConversationByIdResBody = Awaited<
  ReturnType<typeof repository.getConversationById>
>;

type CreateConversationReqBody = Omit<MessageInput, "conversationId">;
type CreateConversationResBody = Pick<Conversation, "id">;
type DeleteConversationResBody = Pick<Conversation, "id" | "deletedAt">;
type AddMessageToConversationResBody = Pick<Conversation, "id">;
type AddMessageToConversationReqBody = Omit<MessageInput, "conversationId">;
type AddMessageReceiptsResBody = MessageReceipt[];

export type {
  AddMessageToConversationReqParams,
  AddMessageToConversationValidatedReq,
  GetConversationsByUserAccountIdReqBody,
  GetConversationsByUserAccountIdResBody,
  GetConversationByIdReqParams,
  GetConversationByIdValidatedReq,
  GetConversationByIdResBody,
  AddMessageReceiptsReqParams,
  AddMessageReceiptsReqBody,
  AddMessageReceiptsValidatedReq,
  DeleteConversationReqParams,
  DeleteConversationResBody,
  DeleteConversationValidatedReq,
  CreateConversationReqBody,
  CreateConversationResBody,
  AddMessageToConversationReqBody,
  AddMessageToConversationResBody,
  AddMessageReceiptsResBody,
};
