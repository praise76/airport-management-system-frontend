import { useState } from "react";
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
import { useCreateRoster } from "../api";
import { useDepartments, useDepartmentUnits } from "@/hooks/departments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateRosterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRosterModal({
  open,
  onOpenChange,
}: CreateRosterModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");

  const { data: departments, isLoading: departmentsLoading } = useDepartments({
    limit: 100,
  });
  const { data: units, isLoading: unitsLoading } =
    useDepartmentUnits(departmentId);

  // console.log("units", units);

  const { mutate, isPending } = useCreateRoster();

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setUnitId(""); // Reset unit when department changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        name,
        startDate,
        endDate,
        unitId: unitId || undefined,
        departmentId: departmentId || undefined,
        status: "draft",
      },
      {
        onSuccess: () => {
          toast.success("Roster created successfully");
          onOpenChange(false);
          setName("");
          setStartDate("");
          setEndDate("");
          setDepartmentId("");
          setUnitId("");
        },
        onError: (err: any) =>
          toast.error(err?.message || "Failed to create roster"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Roster</DialogTitle>
          <DialogDescription>
            Define the period and team for this roster.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Roster Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jan 2024 - Team A"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    departmentsLoading ? "Loading..." : "Select Department"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {departments?.data
                  ?.filter((d) => d.departmentLevel === 1)
                  .map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unit (Optional)</Label>
            <Select
              value={unitId}
              onValueChange={setUnitId}
              disabled={!departmentId || unitsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !departmentId
                      ? "Select a department first"
                      : unitsLoading
                        ? "Loading units..."
                        : "Select Unit"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {units?.data?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Roster
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
