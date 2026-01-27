import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/messages/")({
  component: MessagesIndex,
});

function MessagesIndex() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <div className="w-16 h-16 bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)] rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-(--color-primary)" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-(--color-text)">
        Select a Conversation
      </h2>
      <p className="max-w-xs">
        Choose a conversation from the list or start a new one to begin
        messaging.
      </p>
    </div>
  );
}
