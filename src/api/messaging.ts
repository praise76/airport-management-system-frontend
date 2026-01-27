import { api } from "./client";
import type {
  Conversation,
  Message,
  CreateGroupPayload,
  User,
} from "@/types/messaging";

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string; // for messages
  before?: string;
  after?: string;
}

export interface ConversationListParams extends PaginationParams {
  type?: PaginationParams['limit'] | 'all' | 'direct' | 'group' | 'emergency';
  archived?: boolean;
}

export interface UserSearchParams {
  q: string;
  departmentId?: string;
  limit?: number;
}

export interface SendMessagePayload {
  content: string;
  messageType: 'text' | 'file' | 'emergency';
  attachments?: any[];
  parentMessageId?: string;
  priority?: 'normal' | 'critical';
  requiresAcknowledgment?: boolean;
  metadata?: any;
}

// 1. List Conversations
export async function getConversations(params?: ConversationListParams) {
  const res = await api.get("/messages/conversations", { params });
  return res.data; // Returns { success, data: { conversations, total, page, limit } }
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await api.get(`/messages/conversations/${id}`);
  return res.data.data;
}

// 2. Search Users
export async function searchUsers(params: UserSearchParams): Promise<User[]> {
  const res = await api.get("/messages/users/search", { params });
  return res.data.data;
}

// 3. Start/Get Direct Conversation
export async function createDirectConversation(targetUserId: string): Promise<Conversation> {
  const res = await api.post("/messages/conversations/direct", { targetUserId });
  return res.data.data;
}

// 4. Create Group Conversation
export async function createGroupConversation(payload: CreateGroupPayload): Promise<Conversation> {
  const res = await api.post("/messages/conversations/group", payload);
  return res.data.data;
}

// 5. Get Messages (Paginated)
export async function getMessages(
  conversationId: string,
  params?: {
    before?: string;
    after?: string;
    limit?: number;
    pinned?: boolean;
    search?: string;
  }
): Promise<Message[]> {
  const res = await api.get(`/messages/conversations/${conversationId}/messages`, { params });
  return res.data.data;
}

// 6. Send Message
export async function sendMessage(conversationId: string, payload: SendMessagePayload): Promise<Message> {
  const res = await api.post(`/messages/conversations/${conversationId}/messages`, payload);
  return res.data.data;
}

// 7. Edit Message
export async function editMessage(messageId: string, content: string): Promise<Message> {
  const res = await api.patch(`/messages/${messageId}`, { content });
  return res.data.data;
}

// 8. Delete Message
export async function deleteMessage(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}

// 9. Add/Remove Reaction
export async function addReaction(messageId: string, reactionType: string): Promise<void> {
  await api.post(`/messages/${messageId}/reactions`, { reactionType });
}

export async function removeReaction(messageId: string, reactionType: string): Promise<void> {
  await api.delete(`/messages/${messageId}/reactions/${reactionType}`);
}

// 10. Mark Conversation as Read
export async function markAsRead(conversationId: string): Promise<void> {
  await api.post(`/messages/conversations/${conversationId}/read`);
}

// 11. Get Unread Counts
export async function getUnreadCounts() {
  const res = await api.get("/messages/unread");
  return res.data.data; // { total, byConversation: [] }
}

// 12. Pin/Unpin Message
export async function pinMessage(messageId: string): Promise<void> {
  await api.post(`/messages/${messageId}/pin`);
}

export async function unpinMessage(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}/pin`);
}

// 13. Acknowledge Emergency Message
export async function acknowledgeMessage(messageId: string, response: string): Promise<any> {
  const res = await api.post(`/messages/${messageId}/acknowledge`, { response });
  return res.data.data;
}

// 14. Add/Remove Group Member
export async function addGroupMember(conversationId: string, userId: string): Promise<void> {
  await api.post(`/messages/conversations/${conversationId}/members`, { userId, role: 'member' });
}

export async function removeGroupMember(conversationId: string, userId: string): Promise<void> {
  await api.delete(`/messages/conversations/${conversationId}/members/${userId}`);
}

// 15. Leave Conversation
export async function leaveConversation(conversationId: string): Promise<void> {
  await api.post(`/messages/conversations/${conversationId}/leave`);
}

