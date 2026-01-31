import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddRosterEntry,
  useUpdateRosterEntry,
  useDeleteRosterEntry,
  useGetShiftDefinitions,
} from "../api";
import { useTerminals } from "@/hooks/terminals";
import { RosterEntry, ShiftType } from "../types";
import { toast } from "sonner";
import { format } from "date-fns";

interface ManageEntryModalProps {
  rosterId: string;
  userId: string;
  date: Date;
  existingEntry?: RosterEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: string; // Passed to filter shifts
}

export function ManageEntryModal({
  rosterId,
  userId,
  date,
  existingEntry,
  open,
  onOpenChange,
  unitId,
}: ManageEntryModalProps) {
  const [shift, setShift] = useState<ShiftType>("morning");
  const [shiftDefinitionId, setShiftDefinitionId] = useState<string>(""); // Selection state
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [terminalId, setTerminalId] = useState<string>("");

  const { data: shiftDefinitions } = useGetShiftDefinitions({ unitId });
  const { data: terminals } = useTerminals();

  const addMutation = useAddRosterEntry();
  const updateMutation = useUpdateRosterEntry();
  const deleteMutation = useDeleteRosterEntry();

  useEffect(() => {
    if (existingEntry) {
      setShift(existingEntry.shift);
      setShiftDefinitionId(existingEntry.shiftDefinitionId || "custom");
      setStartTime(existingEntry.shiftStartTime?.slice(0, 5) || "08:00");
      setEndTime(existingEntry.shiftEndTime?.slice(0, 5) || "16:00");
      setPosition(existingEntry.dutyPosition || "");
      setLocation(existingEntry.dutyLocation || "");
      setTerminalId((existingEntry as any).terminalId || "");
    } else {
      // Defaults
      setShift("morning");
      setShiftDefinitionId("custom");
      setStartTime("08:00");
      setEndTime("16:00");
      setPosition("");
      setLocation("");
      setTerminalId("");
    }
  }, [existingEntry, open]);

  // Handle Shift Definition Selection
  const handleShiftSelect = (val: string) => {
    setShiftDefinitionId(val);
    if (val === "custom") return;

    const selected = shiftDefinitions?.find((s) => s.id === val);
    if (selected) {
      setStartTime(selected.startTime?.slice(0, 5) || "08:00");
      setEndTime(selected.endTime?.slice(0, 5) || "16:00");
      // Optionally deduce morning/afternoon/night based on time
      // Just keeping current shift type for now or could infer
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryData: any = {
      staffId: userId,
      unitDepartmentId: unitId,
      dutyDate: format(date, "yyyy-MM-dd"), // Ensure correct format
      shift,
      shiftStartTime: startTime,
      shiftEndTime: endTime,
      dutyPosition: position,
      dutyLocation: location,
      terminalId: terminalId || undefined,
      status: "scheduled" as const,
    };

    // Only send if not custom
    if (shiftDefinitionId !== "custom") {
      entryData.shiftDefinitionId = shiftDefinitionId;
    }

    if (existingEntry) {
      updateMutation.mutate(
        { rosterId, entryId: existingEntry.id, updates: entryData },
        {
          onSuccess: () => {
            toast.success("Shift updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update shift"),
        },
      );
    } else {
      addMutation.mutate(
        { rosterId, entry: entryData },
        {
          onSuccess: () => {
            toast.success("Shift added");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to add shift"),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!existingEntry) return;
    if (confirm("Are you sure you want to remove this shift?")) {
      deleteMutation.mutate(
        { rosterId, entryId: existingEntry.id },
        {
          onSuccess: () => {
            toast.success("Shift removed");
            onOpenChange(false);
          },
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingEntry ? "Edit Shift" : "Add Shift"}
          </DialogTitle>
          <DialogDescription>
            {format(date, "EEEE, MMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shift Preset Selection */}
          <div className="space-y-2">
            <Label>Shift Preset</Label>
            <Select value={shiftDefinitionId} onValueChange={handleShiftSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Hours</SelectItem>
                {shiftDefinitions?.map((def) => (
                  <SelectItem key={def.id} value={def.id}>
                    {def.name} ({def.startTime?.slice(0, 5)} -{" "}
                    {def.endTime?.slice(0, 5)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shift Type</Label>
            <Select
              value={shift}
              onValueChange={(val) => setShift(val as ShiftType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Supervisor"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gate 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Terminal (Optional)</Label>
            <Select value={terminalId} onValueChange={setTerminalId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {terminals?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.terminalName} ({t.terminalCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="fle sm:justify-between">
            {existingEntry && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {existingEntry ? "Save Changes" : "Add Shift"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
