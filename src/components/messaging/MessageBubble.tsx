import { Message } from "@/types/messaging";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, FileText } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  isSelf,
  showAvatar = true,
}: MessageBubbleProps) {
  const isEmergency = message.messageType === "emergency";

  return (
    <div
      className={cn(
        "flex gap-2 mb-2 max-w-[80%]",
        isSelf ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {/* Avatar */}
      <div className={cn("shrink-0 w-8", !showAvatar && "opacity-0")}>
        {!isSelf && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender.photoUrl} />
            <AvatarFallback>{message.sender.firstName[0]}</AvatarFallback>
          </Avatar>
        )}
      </div>

      <div
        className={cn("flex flex-col", isSelf ? "items-end" : "items-start")}
      >
        {!isSelf && showAvatar && (
          <span className="text-[10px] text-[color-mix(in_oklab,var(--color-text)_50%,transparent)] ml-1 mb-1">
            {message.sender.firstName}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm shadow-sm relative",
            isSelf
              ? "bg-(--color-primary) text-(--color-primary-foreground) rounded-tr-sm"
              : "bg-(--color-surface) border border-(--color-border) rounded-tl-sm",
            isEmergency &&
              "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800",
          )}
        >
          {/* Emergency Badge */}
          {isEmergency && (
            <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
              🚨 CRITICAL ALERT
            </div>
          )}

          {/* Content */}
          <div className="whitespace-pre-wrap wrap-break-word">
            {message.content}
          </div>

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((file, i) => (
                <a
                  key={i}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-2 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-xs",
                    isSelf ? "text-white" : "text-(--color-text)",
                  )}
                >
                  <FileText size={14} />
                  <span className="truncate max-w-[150px]">
                    {file.originalName}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Metadata: Time & Status */}
          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70",
              isSelf
                ? "text-white/80"
                : "text-[color-mix(in_oklab,var(--color-text)_50%,transparent)]",
            )}
          >
            <span>{format(new Date(message.createdAt), "h:mm a")}</span>
            {isSelf && (
              <span>
                {message.readAt ? (
                  <CheckCheck size={12} />
                ) : (
                  <Check size={12} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
