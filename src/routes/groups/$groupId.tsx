import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  UserPlus,
  ArrowLeft,
  Shield,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import {
  getGroup,
  listGroupMembers,
  addGroupMember,
  removeGroupMember,
} from "@/api/groups";
import { useUsers } from "@/hooks/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/groups/$groupId")({
  component: GroupDetailsPage,
});

function GroupDetailsPage() {
  const { groupId } = Route.useParams();
  const queryClient = useQueryClient();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  // Queries
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroup(groupId),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => listGroupMembers(groupId),
  });

  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data || [];

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      addGroupMember(groupId, data),
    onSuccess: () => {
      toast.success("Member added successfully");
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      setAddMemberOpen(false);
      setSelectedUserId("");
    },
    onError: () => toast.error("Failed to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeGroupMember(groupId, userId),
    onSuccess: () => {
      toast.success("Member removed successfully");
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const handleAddMember = () => {
    if (!selectedUserId) return;
    addMemberMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  if (groupLoading)
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  if (!group) return <div className="py-10 text-center">Group not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/groups">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {group.groupName}
            </h1>
            {group.isAutoManaged && (
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-50 text-blue-700 border-blue-200"
              >
                <Settings2 className="h-3 w-3" />
                Auto-Managed
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground capitalize flex items-center gap-2 mt-1">
            {group.groupType} Group • {group.visibility}
          </p>
        </div>
      </div>

      {group.isAutoManaged && (
        <Alert className="bg-blue-50/50 border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Managed Group</AlertTitle>
          <AlertDescription>
            Membership for this group is automatically managed based on{" "}
            <strong>
              {group.autoIncludeRule === "managers_only"
                ? "Management Role"
                : "Department Affiliation"}
            </strong>
            . Manual removal of auto-added members is disabled to ensure
            consistency.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members?.length || 0} members in this group
            </CardDescription>
          </div>
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member to {group.groupName}</DialogTitle>
                <DialogDescription>
                  Select a user to add to this group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User</label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => {
                        const isAlreadyMember = members?.some(
                          (m) => m.userId === user.id,
                        );
                        return (
                          <SelectItem
                            key={user.id}
                            value={user.id}
                            disabled={isAlreadyMember}
                          >
                            {user.firstName} {user.lastName}{" "}
                            {isAlreadyMember ? "(Member)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {members?.map((member) => {
                const user = users.find((u) => u.id === member.userId);
                const isRemovable = !group.isAutoManaged || !member.isAutoAdded;
                // Logic: If group is auto-managed, disable remove for auto-added members.
                // Fallback logic: If isAutoAdded is undefined but group is autoManaged, we might want to be conservative or lenient.
                // Based on requirement "disable for auto-added members", if we don't know they are auto-added, we assume manual.
                // But for specific roles like 'all_department', almost everyone is auto-added.

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user
                            ? `${user.firstName[0]}${user.lastName[0]}`
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user
                            ? `${user.firstName} ${user.lastName}`
                            : "Unknown User"}
                          {member.isAutoAdded && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-[10px] h-5 px-1 bg-blue-50 text-blue-600 border-blue-200 cursor-help"
                                  >
                                    Auto
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Automatically added by system rule
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {member.role} • Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {isRemovable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          removeMemberMutation.mutate(member.userId)
                        }
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Cannot remove member from auto-managed group.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
              {members?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No members in this group.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
