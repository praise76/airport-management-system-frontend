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
import { useUsers } from "@/hooks/users";
import { useRequestSwap } from "../api";
import { RosterEntry } from "../types";
import { format } from "date-fns";
import { toast } from "sonner";

interface SwapRequestModalProps {
  entry: RosterEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SwapRequestModal({
  entry,
  open,
  onOpenChange,
}: SwapRequestModalProps) {
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const { mutate: requestSwap, isPending } = useRequestSwap();
  const { data: usersData } = useUsers({ limit: 100 }); // Assuming small team for now, ideally filter by same unit/dept

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !reason) {
      toast.error("Please fill in all fields");
      return;
    }

    requestSwap(
      {
        entryToGiveId: entry.id,
        targetUserId,
        reason,
      },
      {
        onSuccess: () => {
          toast.success("Swap request sent successfully");
          onOpenChange(false);
          setTargetUserId("");
          setReason("");
        },
        onError: () => {
          toast.error("Failed to send swap request");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Shift Swap</DialogTitle>
          <DialogDescription>
            Request to swap your shift on{" "}
            {format(new Date(entry.dutyDate), "MMM dd")} ({entry.shift} shift).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-user">Swap with</Label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger id="target-user">
                <SelectValue placeholder="Select a colleague" />
              </SelectTrigger>
              <SelectContent>
                {usersData?.data
                  ?.filter((u: any) => u.id !== entry.staffId)
                  .map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need to swap?"
            />
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
              {isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
