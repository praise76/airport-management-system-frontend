
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRoster } from "../api";
import { toast } from "sonner";

interface CreateRosterModalProps {
  // trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRosterModal({ open, onOpenChange }: CreateRosterModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // These should ideally specific selectors, but for now hardcoded or inputs
  const [unitId, setUnitId] = useState(""); 
  const [departmentId, setDepartmentId] = useState("");

  const { mutate, isPending } = useCreateRoster();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { name, startDate, endDate, unitId: unitId || undefined, departmentId: departmentId || undefined, status: 'draft' },
      {
        onSuccess: () => {
          toast.success("Roster created successfully");
          onOpenChange(false);
          setName("");
          setStartDate("");
          setEndDate("");
        },
        onError: () => toast.error("Failed to create roster"),
      }
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jan 2024 - Team A" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
             </div>
          </div>
          <div className="space-y-2">
             <Label htmlFor="unit">Unit ID (Optional for now)</Label>
             <Input id="unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="UUID" />
          </div>
           <div className="space-y-2">
             <Label htmlFor="dept">Dept ID (Optional for now)</Label>
             <Input id="dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} placeholder="UUID" />
          </div>
          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
             <Button type="submit" disabled={isPending}>Create Roster</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
