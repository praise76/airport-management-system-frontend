import { api } from "./client";
import type {
  Conversation,
  ConversationInput,
  Message,
  MessageInput,
  ConversationListParams,
  MessageListParams,
} from "@/types/messaging";

// Conversations
export async function getConversations(params?: ConversationListParams): Promise<Conversation[]> {
  const res = await api.get("/messaging/conversations", { params });
  return res.data.data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await api.get(`/messaging/conversations/${id}`);
  return res.data.data;
}

export async function createConversation(input: ConversationInput): Promise<Conversation> {
  const res = await api.post("/messaging/conversations", input);
  return res.data.data;
}

// Messages
export async function getMessages(conversationId: string, params?: MessageListParams): Promise<Message[]> {
  const res = await api.get(`/messaging/conversations/${conversationId}/messages`, { params });
  return res.data.data;
}

export async function sendMessage(conversationId: string, input: MessageInput): Promise<Message> {
  const res = await api.post(`/messaging/conversations/${conversationId}/messages`, input);
  return res.data.data;
}

// Mark as read
export async function markAsRead(conversationId: string): Promise<void> {
  await api.post(`/messaging/conversations/${conversationId}/read`);
}
