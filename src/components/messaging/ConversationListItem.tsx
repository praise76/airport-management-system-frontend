import { Conversation } from "@/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Users, AlertTriangle, Book, Clock } from "lucide-react";

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

  // Enchanced Chat Props
  const settings = conversation.settings || {};
  const isShiftChannel =
    conversation.type === "unit" &&
    settings.isStationChannel &&
    !settings.isStationMasterChannel;
  const isMasterChannel =
    conversation.type === "unit" && settings.isStationMasterChannel;
  const shiftType = settings.shiftType;

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
        <Avatar
          className={cn(
            "h-10 w-10 border border-(--color-border)",
            isShiftChannel &&
              "ring-2 ring-green-500 ring-offset-1 ring-offset-(--color-surface)",
            isMasterChannel &&
              "ring-2 ring-amber-500/50 ring-offset-1 ring-offset-(--color-surface)",
          )}
        >
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
            ) : isMasterChannel ? (
              <Book className="h-4 w-4" />
            ) : isShiftChannel ? (
              <Clock className="h-4 w-4" />
            ) : (
              fallback
            )}
          </AvatarFallback>
        </Avatar>
        {/* Simple online indicator logic could go here if we passed online status */}
        {isShiftChannel && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[9px] px-1 rounded-full border border-white">
            {shiftType || "NOW"}
          </div>
        )}
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
