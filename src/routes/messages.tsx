import {
  createFileRoute,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMessagingStore } from "@/stores/messages";
import { ConversationListItem } from "@/components/messaging/ConversationListItem";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/messages")({
  component: MessagesLayout,
});

import { useQueryClient } from "@tanstack/react-query";
import { useConversations } from "@/hooks/messaging";

function MessagesLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: conversationsResponse, isLoading: isLoadingConversations } =
    useConversations({ page: 1, limit: 20, type: "all" });

  console.log("conversationsResponse", conversationsResponse);

  const conversations = conversationsResponse?.data?.conversations || [];

  const { initializeSocket, cleanupSocket } = useMessagingStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      initializeSocket(queryClient);
    }
    return () => {
      cleanupSocket();
    };
  }, [user, queryClient]);

  // Check if we are selecting a conversation (for mobile view logic)
  const isDetailView =
    location.pathname.includes("/messages/") &&
    location.pathname !== "/messages" &&
    location.pathname !== "/messages/";

  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = c.name?.toLowerCase() || "";
    const otherUser = c.otherUser
      ? `${c.otherUser.firstName} ${c.otherUser.lastName}`.toLowerCase()
      : "";
    return name.includes(query) || otherUser.includes(query);
  });

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-(--color-bg)">
      {/* Sidebar - Hidden on mobile if viewing details */}
      <div
        className={cn(
          "w-full md:w-80 flex-col border-r border-(--color-border) bg-(--color-surface)",
          isDetailView ? "hidden md:flex" : "flex",
        )}
      >
        <div className="p-4 border-b border-(--color-border)">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate({ to: "/messages/new" })}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filter Tabs could go here */}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {isLoadingConversations && (
              <div className="p-4 text-center text-sm opacity-50">
                Loading...
              </div>
            )}
            {filteredConversations.map((conv: any) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={location.pathname === `/messages/${conv.id}`}
                onClick={() => navigate({ to: `/messages/${conv.id}` })}
              />
            ))}
            {!isLoadingConversations && filteredConversations.length === 0 && (
              <div className="p-4 text-center text-sm opacity-50">
                {searchQuery ? "No filtered results" : "No conversations yet"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-(--color-bg)",
          !isDetailView ? "hidden md:flex" : "flex",
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}
