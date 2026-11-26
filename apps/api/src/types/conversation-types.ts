import type {
  Conversation,
  Message,
  MessageReceipt,
  User,
  UserAccount,
  UserConversation,
} from "../../generated/prisma/client.ts";
import type { ParamsDictionary } from "express-serve-static-core";
import type { MessageInput } from "../types/message-types.ts";
import type { AvatarUrl } from "./user-types.ts";

interface AddMessageToConversationReqParams extends ParamsDictionary {
  id: string;
}

interface AddMessageToConversationValidatedReq {
  id: Conversation["id"];
  content: Message["content"];
  recipientId: UserAccount["id"];
}

interface ConversationSummary {
  id: Conversation["id"];
  updatedAt: Conversation["updatedAt"];
  unreadCount: UserConversation["unreadCount"];
  recipient: {
    id: UserAccount["id"];
    firstName: User["firstName"];
    lastName: User["lastName"];
    avatarUrl: AvatarUrl;
  };
  latestMessage: {
    id: Message["id"];
    content: Message["content"];
    createdAt: Message["createdAt"];
    senderId: UserAccount["id"];
  } | null;
}

interface ConversationDetail {
  id: Conversation["id"];
  updatedAt: Conversation["updatedAt"];
  recipient: ConversationSummary["recipient"] & { email: User["email"] };
  messages: {
    id: Message["id"];
    content: Message["content"];
    createdAt: Message["createdAt"];
    senderId: UserAccount["id"];
    // When the other participant read it; null while unread.
    readAt: MessageReceipt["readAt"] | null;
  }[];
}

interface GetConversationByIdReqParams extends ParamsDictionary {
  id: string;
}

interface GetConversationByIdValidatedReq {
  id: Conversation["id"];
}

interface AddMessageReceiptsReqParams extends ParamsDictionary {
  id: string;
}

interface AddMessageReceiptsValidatedReq {
  id: Conversation["id"];
}

interface DeleteConversationReqParams extends ParamsDictionary {
  id: string;
}

interface DeleteConversationValidatedReq {
  id: Conversation["id"];
}

interface UnarchiveConversationReqParams extends ParamsDictionary {
  id: string;
}

interface UnarchiveConversationValidatedReq {
  id: Conversation["id"];
}

type GetConversationsByUserAccountIdResBody = ConversationSummary[];
type GetArchivedConversationsResBody = ConversationSummary[];

interface GetUnreadCountResBody {
  unreadCount: UserConversation["unreadCount"];
}

type GetConversationByIdResBody = ConversationDetail;

interface CreateConversationReqBody {
  recipientId: UserAccount["id"];
  content?: Message["content"];
}

interface CreateConversationValidatedReq {
  recipientId: UserAccount["id"];
  content?: Message["content"];
}

type CreateConversationResBody = Pick<Conversation, "id">;
type DeleteConversationResBody = Pick<Conversation, "id">;
type UnarchiveConversationResBody = Pick<Conversation, "id">;
type AddMessageToConversationResBody = Pick<Conversation, "id">;
type AddMessageToConversationReqBody = Omit<MessageInput, "conversationId">;
type AddMessageReceiptsResBody = MessageReceipt[];

export type {
  AddMessageToConversationReqParams,
  AddMessageToConversationValidatedReq,
  ConversationSummary,
  ConversationDetail,
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
};
