import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as MessagingApi from "@/api/messaging";
import type { ConversationInput, MessageInput, ConversationListParams, MessageListParams } from "@/types/messaging";
import { toast } from "sonner";

export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: ["messaging", "conversations", params],
    queryFn: () => MessagingApi.getConversations(params),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["messaging", "conversations", id],
    queryFn: () => MessagingApi.getConversation(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConversationInput) => MessagingApi.createConversation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messaging", "conversations"] });
      toast.success("Conversation created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create conversation"),
  });
}

export function useMessages(conversationId: string, params?: MessageListParams) {
  return useQuery({
    queryKey: ["messaging", "messages", conversationId, params],
    queryFn: () => MessagingApi.getMessages(conversationId, params),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll for new messages every 5s
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, input }: { conversationId: string; input: MessageInput }) =>
      MessagingApi.sendMessage(conversationId, input),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messaging", "messages", conversationId] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to send message"),
  });
}

export function useMarkAsRead() {
  return useMutation({
    mutationFn: (conversationId: string) => MessagingApi.markAsRead(conversationId),
  });
}
