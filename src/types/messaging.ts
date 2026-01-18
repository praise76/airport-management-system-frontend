// Messaging Types based on OpenAPI spec

export type MessageType = "text" | "image" | "file" | "system";

export interface ConversationParticipant {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  isGroup: boolean;
  groupName: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  participants: ConversationParticipant[];
}

export interface ConversationInput {
  participantIds: string[];
  isGroup?: boolean;
  groupName?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MessageInput {
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string;
}

export interface ConversationListParams {
  page?: number;
  limit?: number;
}

export interface MessageListParams {
  page?: number;
  limit?: number;
  before?: string;
}
