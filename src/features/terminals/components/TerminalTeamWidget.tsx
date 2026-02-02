import {
  useTerminalRepresentatives,
  useAddTerminalRepresentative,
  useRemoveTerminalRepresentative,
} from "@/hooks/terminals";
import { useDepartments } from "@/hooks/departments";
import { useStaff } from "@/hooks/staff";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, ShieldCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TerminalTeamWidgetProps {
  terminalId: string;
}

export function TerminalTeamWidget({ terminalId }: TerminalTeamWidgetProps) {
  const { data: representatives, isLoading } =
    useTerminalRepresentatives(terminalId);
  const { data: departmentsResponse } = useDepartments();
  const { data: staffMembers } = useStaff();

  const addRep = useAddTerminalRepresentative();
  const removeRep = useRemoveTerminalRepresentative();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    departmentId: "",
    role: "",
    isPrimary: false,
  });

  const departments = Array.isArray(departmentsResponse)
    ? departmentsResponse
    : (departmentsResponse as any)?.data || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.departmentId || !form.role) return;

    addRep.mutate(
      {
        terminalId,
        input: {
          userId: form.userId,
          departmentId: form.departmentId,
          role: form.role,
          isPrimary: form.isPrimary ? "Y" : "N",
        },
      },
      {
        onSuccess: () => {
          setShowAdd(false);
          setForm({ userId: "", departmentId: "", role: "", isPrimary: false });
        },
      },
    );
  };

  const handleRemove = (id: string) => {
    if (confirm("Remove this representative?")) {
      removeRep.mutate(id);
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">Loading team members...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Terminal Focal Points</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key personnel assigned as departmental leads
          </p>
        </div>
        <Button
          size="sm"
          variant={showAdd ? "ghost" : "outline"}
          onClick={() => setShowAdd(!showAdd)}
          className="gap-2"
        >
          {showAdd ? (
            "Cancel"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add Representative
            </>
          )}
        </Button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="space-y-4 p-4 bg-muted/20 rounded-xl border border-(--color-border)"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium px-0.5">Staff Member</label>
              <select
                required
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-(--color-background) border border-(--color-border) rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Select Staff...</option>
                {staffMembers?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName} ({staff.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium px-0.5">Department</label>
              <select
                required
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-(--color-background) border border-(--color-border) rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium px-0.5">Role/Title</label>
              <input
                required
                placeholder="e.g. Primary focal point"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-(--color-background) border border-(--color-border) rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 h-10 px-0.5">
              <input
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={(e) =>
                  setForm({ ...form, isPrimary: e.target.checked })
                }
                className="h-4 w-4 rounded border-(--color-border) text-primary"
              />
              <label
                htmlFor="isPrimary"
                className="text-sm font-medium cursor-pointer"
              >
                Set as Primary Lead
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={addRep.isPending}
              className="px-6"
            >
              {addRep.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Representative"
              )}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {representatives?.map((rep) => (
          <div
            key={rep.id}
            className="flex items-center justify-between p-4 border border-(--color-border) rounded-xl bg-(--color-surface) hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {rep.user?.firstName?.[0]}
                {rep.user?.lastName?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {rep.user?.firstName} {rep.user?.lastName}
                  </span>
                  {rep.isPrimary === "Y" && (
                    <Badge
                      variant="success"
                      className="h-5 px-1.5 gap-1 font-medium"
                    >
                      <ShieldCheck className="h-3 w-3" /> Primary
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-primary/80">
                    {rep.department?.name}
                  </span>
                  <span>•</span>
                  <span>{rep.role}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(rep.id)}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {!representatives?.length && !showAdd && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-(--color-border) rounded-xl bg-muted/5">
            <UserPlus className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No focal points have been assigned yet.
            </p>
            <Button
              variant="link"
              onClick={() => setShowAdd(true)}
              className="mt-1"
            >
              Add the first representative
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
