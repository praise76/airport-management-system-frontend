import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as MessagingApi from "@/api/messaging";
import type { SendMessagePayload, ConversationListParams } from "@/api/messaging";
import type { CreateGroupPayload } from "@/types/messaging";
import { toast } from "sonner";

export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: (params?: any) => [...messagingKeys.all, "conversations", params] as const,
  conversation: (id: string) => [...messagingKeys.all, "conversation", id] as const,
  messages: (conversationId: string, params?: any) => [...messagingKeys.all, "messages", conversationId, params] as const,
  unread: () => [...messagingKeys.all, "unread"] as const,
};

// Conversations
export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: messagingKeys.conversations(params),
    queryFn: () => MessagingApi.getConversations(params),
  });
}

/** Page size the server allows for the chat list (max 50). */
const CONVERSATION_PAGE = 50;

/** The chat list, a page at a time: `fetchNextPage` loads the next 50 ("Load more"). */
export function useConversationPages(type: ConversationListParams["type"] = "all") {
  return useInfiniteQuery({
    // Starts with "conversations" so the socket's invalidation of that prefix refreshes it.
    queryKey: [...messagingKeys.all, "conversations", "pages", type] as const,
    queryFn: ({ pageParam }) =>
      MessagingApi.getConversations({ page: pageParam, limit: CONVERSATION_PAGE, type }),
    initialPageParam: 1,
    getNextPageParam: (last: any) => {
      const d = last?.data;
      return d && d.page * d.limit < d.total ? d.page + 1 : undefined;
    },
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: messagingKeys.conversation(id),
    queryFn: () => MessagingApi.getConversation(id),
    enabled: !!id,
  });
}

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => MessagingApi.createDirectConversation(userId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: messagingKeys.all });
      toast.success("Conversation started");
      return data;
    },
    onError: (err: any) => toast.error(err.message || "Failed to start conversation"),
  });
}

export function useCreateGroupConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => MessagingApi.createGroupConversation(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: messagingKeys.all });
      toast.success("Group created");
      return data;
    },
    onError: (err: any) => toast.error(err.message || "Failed to create group"),
  });
}

// Messages
export function useMessages(conversationId: string, params?: any) {
  return useQuery({
    queryKey: messagingKeys.messages(conversationId, params),
    queryFn: () => MessagingApi.getMessages(conversationId, params),
    enabled: !!conversationId,
    // We can rely on WebSocket updates instead of polling, 
    // OR keep polling as a fallback. Let's start with Just Query.
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: string; payload: SendMessagePayload }) =>
      MessagingApi.sendMessage(conversationId, payload),
    onSuccess: (_, variables) => {
      // Optimistic update could happen here or via onMutate
      // For now, invalidate to re-fetch or let socket handle it
      qc.invalidateQueries({ queryKey: messagingKeys.messages(variables.conversationId) });
      qc.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
    onError: (err: any) => toast.error(err.message || "Failed to send message"),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => MessagingApi.markAsRead(conversationId),
    onSuccess: () => {
       qc.invalidateQueries({ queryKey: messagingKeys.unread() });
       qc.invalidateQueries({ queryKey: messagingKeys.conversations() });
    }
  });
}

export function useUnreadCounts() {
    return useQuery({
        queryKey: messagingKeys.unread(),
        queryFn: MessagingApi.getUnreadCounts,
        refetchInterval: 30000, 
    });
}
