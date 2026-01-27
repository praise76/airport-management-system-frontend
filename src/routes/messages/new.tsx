import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchUsers,
  createDirectConversation,
  createGroupConversation,
} from "@/api/messaging";
import { User } from "@/types/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/new")({
  component: NewConversationPage,
});

function NewConversationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("direct");

  return (
    <div className="flex flex-col h-full bg-(--color-background)">
      <div className="p-4 border-b border-(--color-border) flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Conversation</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/messages" })}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="flex space-x-2 mb-6 border-b border-(--color-border)">
          <button
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "direct" ? "border-(--color-primary) text-(--color-primary)" : "border-transparent hover:text-(--color-text)"}`}
            onClick={() => setActiveTab("direct")}
          >
            Direct Message
          </button>
          <button
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "group" ? "border-(--color-primary) text-(--color-primary)" : "border-transparent hover:text-(--color-text)"}`}
            onClick={() => setActiveTab("group")}
          >
            Create Group
          </button>
        </div>

        {activeTab === "direct" ? <NewDirectMessage /> : <NewGroupChat />}
      </div>
    </div>
  );
}

function NewDirectMessage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const users = await searchUsers({ q: query });
      setResults(users);
    } catch (error) {
      toast.error("Failed to search users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    try {
      const conversation = await createDirectConversation(user.id);
      navigate({ to: `/messages/${conversation.id}` });
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
        </Button>
      </form>

      <div className="space-y-2">
        {results.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-(--color-border) hover:bg-muted cursor-pointer"
            onClick={() => handleSelectUser(user)}
          >
            <Avatar>
              <AvatarImage src={user.photoUrl} />
              <AvatarFallback>{user.firstName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewGroupChat() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) return;
    setIsSearching(true);
    try {
      const users = await searchUsers({ q: val });
      setSearchResults(users);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUser = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length === 0) return;
    try {
      const conversation = await createGroupConversation({
        name: groupName,
        memberIds: selectedUsers.map((u) => u.id),
        type: "group",
        settings: { whoCanPost: "everyone", allowFileSharing: true },
      });
      navigate({ to: `/messages/${conversation.id}` });
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Group Name</label>
        <Input
          placeholder="e.g. Security Team"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Add Members</label>
        <div className="relative">
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Selected pills */}
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {user.firstName} {user.lastName}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleUser(user)}
              />
            </div>
          ))}
        </div>

        {/* Search Results */}
        <div className="border rounded-md max-h-48 overflow-y-auto mt-2">
          {searchResults.map((user) => {
            const isSelected = !!selectedUsers.find((u) => u.id === user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                onClick={() => toggleUser(user)}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.photoUrl} />
                    <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        onClick={handleCreateGroup}
        disabled={!groupName || selectedUsers.length === 0}
        className="w-full"
      >
        Create Group
      </Button>
    </div>
  );
}
