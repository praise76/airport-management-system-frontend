import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Shield, Lock, Settings2, Plus } from "lucide-react";
import { listGroups } from "@/api/groups";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export const Route = createFileRoute("/groups/")({
  component: GroupsPage,
});

function GroupsPage() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroups(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Manage user groups and department teams.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[150px]" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No groups found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group-card"
            >
              {group.isAutoManaged && (
                <div className="absolute top-0 right-0 p-2">
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                  >
                    <Settings2 className="h-3 w-3" />
                    Auto-Managed
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start pr-20">
                  {" "}
                  {/* Add padding for badge */}
                  <CardTitle className="text-lg">{group.groupName}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2">
                  {group.groupType === "department" && (
                    <Shield className="h-3 w-3" />
                  )}
                  {group.groupType === "project" && (
                    <Users className="h-3 w-3" />
                  )}
                  <span className="capitalize">{group.groupType} Group</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Visibility:</span>
                    <span className="font-medium capitalize flex items-center gap-1">
                      {group.visibility === "private" && (
                        <Lock className="h-3 w-3" />
                      )}
                      {group.visibility}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>
                      {format(new Date(group.updatedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  {group.isAutoManaged && (
                    <div className="mt-2 text-xs bg-muted/50 p-2 rounded">
                      <span className="font-semibold block text-primary">
                        Automation Rule:
                      </span>
                      {group.autoIncludeRule === "all_department"
                        ? "Includes all department staff"
                        : "Includes managers only"}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      to={`/groups/${group.id}`}
                      params={{ groupId: group.id }}
                    >
                      Manage Members
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
