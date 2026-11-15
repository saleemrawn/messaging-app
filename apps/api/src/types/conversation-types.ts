import type {
  Conversation,
  Message,
  MessageReceipt,
  UserAccount,
} from "../../generated/prisma/client.ts";
import type { MessageInput } from "../types/message-types.ts";
import type { User } from "../types/user-types.ts";
import * as repository from "../conversation/conversation-repository.ts";

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

type GetConversationsByUserAccountIdResBody = Awaited<
  ReturnType<typeof repository.getConversationsByUserAccountId>
>;

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
