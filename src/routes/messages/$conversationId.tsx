import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMessagingStore } from "@/stores/messages";
import { useMessages, useSendMessage } from "@/hooks/messaging";
import { useConversations } from "@/hooks/messaging";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, Info, Paperclip, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/types/messaging";

export const Route = createFileRoute("/messages/$conversationId")({
  component: ConversationView,
});

function ConversationView() {
  const { conversationId } = Route.useParams();
  const user = useAuthStore((s) => s.user);

  // Fetch messages with React Query
  const { data: messagesResponse, isLoading: isLoadingMessages } =
    useMessages(conversationId);
  const conversationMessages = (messagesResponse || []) as Message[];

  // Fetch conversations to get details
  const { data: conversationsResponse } = useConversations();
  const conversations = conversationsResponse?.data?.conversations || [];
  const conversation = conversations.find((c: any) => c.id === conversationId);

  const { setActiveConversation } = useMessagingStore();

  // Mutations
  const sendMessageMutation = useSendMessage();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || sendMessageMutation.isPending) return;

    const content = inputValue;
    setInputValue("");

    sendMessageMutation.mutate({
      conversationId,
      payload: { content, messageType: "text" },
    });
  };

  const displayName =
    conversation?.type === "direct"
      ? `${conversation.otherUser?.firstName || ""} ${conversation.otherUser?.lastName || ""}`
      : conversation?.name || "Conversation";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-(--color-border) bg-(--color-surface)">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation?.otherUser?.photoUrl} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation?.type === "group"
                ? `${conversation.memberCount} members`
                : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
        {isLoadingMessages && !conversationMessages.length ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          conversationMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-(--color-surface) border-t border-(--color-border)">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
            className="rounded-full"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
