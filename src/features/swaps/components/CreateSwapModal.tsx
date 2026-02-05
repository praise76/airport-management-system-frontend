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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateSwap } from "@/hooks/swaps";
// import { useMyRoster } from "@/features/roster/api"; // Assuming this exists or using the one from hooks
import { useUsers } from "@/hooks/users"; // You might need to adjust this import based on actual project structure
import { toast } from "sonner";
import { format } from "date-fns";

// Placeholder for now, replace with actual hook
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

const useUpcomingShifts = () => {
  return useQuery({
    queryKey: ["roster", "my", "upcoming"],
    queryFn: async () => {
      // This endpoint might need to be created or adjusted
      const res = await api.get("/roster/my?upcoming=true");
      return res.data.entries || res.data.data; // Adjust based on actual response
    },
  });
};

interface CreateSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSwapModal({ open, onOpenChange }: CreateSwapModalProps) {
  const [swapType, setSwapType] = useState<
    "direct_swap" | "give_away" | "marketplace"
  >("direct_swap");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "emergency">(
    "normal",
  );
  const [reason, setReason] = useState("");

  const { mutate: createSwap, isPending } = useCreateSwap();
  const { data: shifts } = useUpcomingShifts();
  const { data: users } = useUsers({ limit: 50 });

  console.log("shifts", shifts);

  const handleSubmit = () => {
    if (!selectedShiftId || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (swapType === "direct_swap" && !targetUserId) {
      toast.error("Please select a colleague for direct swap");
      return;
    }

    createSwap(
      {
        rosterEntryId: selectedShiftId,
        targetStaffId: swapType === "direct_swap" ? targetUserId : undefined,
        swapType,
        urgency,
        reason,
        expiresInHours: 48, // Default
      },
      {
        onSuccess: () => {
          toast.success("Request created successfully");
          onOpenChange(false);
          setReason("");
          setSelectedShiftId("");
          setTargetUserId("");
        },
        onError: () => toast.error("Failed to create request"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Shift Swap</DialogTitle>
          <DialogDescription>
            Initiate a swap, give away a shift, or post to the marketplace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Swap Type</Label>
            <RadioGroup
              value={swapType}
              onValueChange={(v: any) => setSwapType(v)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct_swap" id="r1" />
                <Label htmlFor="r1">
                  Direct Swap{" "}
                  <span className="text-muted-foreground font-normal">
                    (Exchange with specific person)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="give_away" id="r2" />
                <Label htmlFor="r2">
                  Give Away{" "}
                  <span className="text-muted-foreground font-normal">
                    (Offer to anyone)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="marketplace" id="r3" />
                <Label htmlFor="r3">
                  Post to Marketplace{" "}
                  <span className="text-muted-foreground font-normal">
                    (Let others claim)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Your Shift</Label>
            <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift to swap" />
              </SelectTrigger>
              <SelectContent>
                {shifts?.map((shift: any) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {format(new Date(shift.dutyDate), "MMM dd")} - {shift.shift}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {swapType === "direct_swap" && (
            <div className="space-y-2">
              <Label>Target Colleague</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select colleague" />
                </SelectTrigger>
                <SelectContent>
                  {users?.data?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Urgency</Label>
            <div className="flex gap-2">
              {["normal", "urgent", "emergency"].map((u) => (
                <Button
                  key={u}
                  type="button"
                  variant={urgency === u ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUrgency(u as any)}
                  className="capitalize"
                >
                  {u}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="Why do you need to swap?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
