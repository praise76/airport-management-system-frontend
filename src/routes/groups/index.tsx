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
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGroup } from "@/hooks/groups";
import { useDepartments } from "@/hooks/departments";

export const Route = createFileRoute("/groups/")({
  component: GroupsPage,
});

function GroupsPage() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => listGroups(),
  });

  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Manage user groups and department teams.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
        <CreateGroupDialog open={creating} onOpenChange={setCreating} />
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
                <div className="flex justify-between items-start">
                  {" "}
                  {/* Add padding for badge */}
                  <CardTitle className="text-lg mt-4">{group.name}</CardTitle>
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

/** The "Create Group" button had no action; this is its form (POST /groups, GroupInput in api.json). */
function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateGroup();
  const { data: depts } = useDepartments({ pageSize: 200 } as never);
  const departments: Array<{ id: string; name: string }> =
    ((depts as any)?.data ?? (depts as any)?.items ?? (Array.isArray(depts) ? depts : [])) as never;
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("department");
  const [departmentId, setDepartmentId] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setProblem("Give the group a name.");
    if (groupType === "department" && !departmentId) return setProblem("Choose the department this group is for.");
    setProblem(null);
    try {
      await create.mutateAsync({ name: name.trim(), groupType, visibility, departmentId: departmentId || (undefined as never) });
      onOpenChange(false);
      setName("");
      setDepartmentId("");
    } catch {
      /* the hook shows the server's reason */
    }
  };

  const select = "w-full h-9 rounded-md border bg-transparent px-3 text-sm";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>Add members from the group's page once it exists.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="g-name">Name</Label>
            <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Passenger Screening Unit" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-type">Type</Label>
            <select id="g-type" className={select} value={groupType} onChange={(e) => setGroupType(e.target.value)}>
              <option value="department">Department</option>
              <option value="project">Project</option>
              <option value="announcement">Announcement</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-dept">Department{groupType === "department" ? "" : " (optional)"}</Label>
            <select id="g-dept" className={select} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Choose…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-vis">Who can see it</Label>
            <select id="g-vis" className={select} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="public">Everyone in the organisation</option>
              <option value="private">Members only</option>
            </select>
          </div>
          {problem && <p role="alert" className="text-sm text-red-600">{problem}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Create group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
