import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/hooks/users";
import { useAddRosterEntry, useDeleteRosterEntry } from "../api";
import { RosterEntry, ShiftDefinition } from "../types";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Plus, UserPlus, Info } from "lucide-react";
import { toast } from "sonner";

interface ManageShiftStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rosterId: string;
  shift: ShiftDefinition;
  date: Date;
  entries: RosterEntry[];
  unitDepartmentId?: string;
}

export function ManageShiftStaffModal({
  open,
  onOpenChange,
  rosterId,
  shift,
  date,
  entries,
  unitDepartmentId,
}: ManageShiftStaffModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: usersData } = useUsers({ limit: 100 });
  const addMutation = useAddRosterEntry();
  const deleteMutation = useDeleteRosterEntry();

  const handleAddStaff = () => {
    if (!selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    // Check if staff already in THIS shift
    if (entries.some((e) => e.staffId === selectedStaffId)) {
      toast.error("Staff member is already assigned to this shift");
      return;
    }

    const entryData: any = {
      staffId: selectedStaffId,
      unitDepartmentId: unitDepartmentId,
      dutyDate: format(date, "yyyy-MM-dd"),

      shift: deduceShiftType(shift.name), // Helper or just keep it simple
      shiftStartTime: shift.startTime,
      shiftEndTime: shift.endTime,
      shiftDefinitionId: shift.id,
      dutyPosition: position || undefined,
      status: "scheduled",
    };

    addMutation.mutate(
      { rosterId, entry: entryData },
      {
        onSuccess: () => {
          toast.success("Staff added to shift");
          setSelectedStaffId("");
          setPosition("");
          setIsAdding(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || "Failed to add staff");
        },
      },
    );
  };

  const handleRemoveStaff = (entryId: string) => {
    if (confirm("Are you sure you want to remove this staff from the shift?")) {
      deleteMutation.mutate(
        { rosterId, entryId },
        {
          onSuccess: () => {
            toast.success("Staff removed from shift");
          },
        },
      );
    }
  };

  // Helper to deduce ShiftType enum from name or just default to morning
  const deduceShiftType = (name: string): "morning" | "afternoon" | "night" => {
    const n = name.toLowerCase();
    if (n.includes("afternoon") || n.includes("pm")) return "afternoon";
    if (n.includes("night") || n.includes("late")) return "night";
    return "morning";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: shift.color || "#3b82f6" }}
            />
            {shift.name} - {format(date, "MMM d, yyyy")}
          </DialogTitle>
          <DialogDescription>
            Manage staff assigned to this shift ({shift.startTime?.slice(0, 5)}{" "}
            - {shift.endTime?.slice(0, 5)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Assigned Staff ({entries.length})
              </h3>
              {!isAdding && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1"
                  onClick={() => setIsAdding(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Staff
                </Button>
              )}
            </div>

            <div className="h-[200px] rounded-md border p-4 bg-muted/20 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                  <p className="text-sm italic">No staff assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.user?.avatarUrl} />
                          <AvatarFallback>
                            {entry.user?.firstName?.[0]}
                            {entry.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {entry.user?.firstName} {entry.user?.lastName}
                          </p>
                          {entry.dutyPosition && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Info className="h-2.5 w-2.5" />
                              {entry.dutyPosition}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveStaff(entry.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isAdding && (
            <div className="space-y-4 border rounded-lg p-4 bg-primary/5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold">New Assignment</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Select Staff</Label>
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.data?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} (
                          {u.position?.name || "Staff"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Duty Position (Optional)</Label>
                  <Input
                    placeholder="e.g. Supervisor, Gate Guard"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button
                  onClick={handleAddStaff}
                  className="w-full gap-2 mt-2"
                  disabled={addMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  {addMutation.isPending ? "Adding..." : "Add to Shift"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
