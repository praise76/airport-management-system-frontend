import { Conversation } from "@/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Users, AlertTriangle } from "lucide-react";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) {
  // Determine display Name and Avatar
  const isDirect = conversation.type === "direct";
  const otherUser = conversation.otherUser;

  const displayName = isDirect
    ? `${otherUser?.firstName} ${otherUser?.lastName}`
    : conversation.name || "Unnamed Group";

  const avatarUrl = isDirect ? otherUser?.photoUrl : undefined;
  const fallback = isDirect
    ? `${otherUser?.firstName?.[0]}${otherUser?.lastName?.[0]}`
    : conversation.name?.[0] || "G";

  const unreadCount = conversation.membership?.unreadCount || 0;
  const isEmergency = conversation.type === "emergency";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative",
        isActive
          ? "bg-[color-mix(in_oklab,var(--color-primary)_15%,transparent)]"
          : "hover:bg-[color-mix(in_oklab,var(--color-text)_5%,transparent)]",
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10 border border-(--color-border)">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback
            className={
              isDirect
                ? ""
                : "bg-(--color-primary) text-(--color-primary-foreground)"
            }
          >
            {conversation.type === "group" && !avatarUrl ? (
              <Users className="h-4 w-4" />
            ) : (
              fallback
            )}
          </AvatarFallback>
        </Avatar>
        {/* Simple online indicator logic could go here if we passed online status */}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4
            className={cn(
              "font-medium truncate text-sm",
              unreadCount > 0
                ? "text-(--color-text)"
                : "text-[color-mix(in_oklab,var(--color-text)_80%,transparent)]",
            )}
          >
            {isEmergency && (
              <AlertTriangle className="inline h-3 w-3 text-red-500 mr-1" />
            )}
            {displayName}
          </h4>
          <span className="text-xs text-[color-mix(in_oklab,var(--color-text)_50%,transparent)] whitespace-nowrap ml-2">
            {conversation.lastMessageAt &&
              formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
              })}
          </span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <p
            className={cn(
              "text-xs truncate max-w-[180px]",
              unreadCount > 0
                ? "font-semibold text-(--color-text)"
                : "text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]",
            )}
          >
            {conversation.lastMessagePreview || "No messages yet"}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-[10px] font-medium text-(--color-primary-foreground)">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
