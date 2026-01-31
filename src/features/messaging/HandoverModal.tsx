import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSendMessage } from "@/hooks/messaging";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface HandoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}

export function HandoverModal({
  open,
  onOpenChange,
  conversationId,
}: HandoverModalProps) {
  const sendMessageMutation = useSendMessage();
  const [status, setStatus] = useState("All Clear");
  const [passengers, setPassengers] = useState(0);
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState("");

  // Equipment check Items could be fetched or hardcoded for now
  const [equipmentChecks, setEquipmentChecks] = useState<
    Record<string, boolean>
  >({
    "Scanner 1": true,
    "Scanner 2": true,
    CCTV: true,
    Radio: true,
  });

  const toggleEquipment = (item: string) => {
    setEquipmentChecks((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSubmit = async () => {
    try {
      const equipmentStatus = Object.entries(equipmentChecks).map(
        ([item, working]) => `${item} - ${working ? "OK" : "Issue"}`,
      );

      await sendMessageMutation.mutateAsync({
        conversationId,
        payload: {
          content: "🔄 Handover Report",
          messageType: "handover",
          metadata: {
            status,
            passengers,
            notes,
            urgent: urgent || undefined,
            equipment: equipmentStatus,
          },
        },
      });

      toast.success("Handover report submitted");
      onOpenChange(false);

      // Reset form
      setNotes("");
      setUrgent("");
      setPassengers(0);
    } catch (error) {
      toast.error("Failed to submit handover report");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Handover Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Clear">All Clear</SelectItem>
                <SelectItem value="Issues Noted">Issues Noted</SelectItem>
                <SelectItem value="Incident">Incident Reported</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Passenger Count</Label>
            <Input
              type="number"
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>Equipment Check</Label>
            <div className="grid grid-cols-2 gap-2 border rounded p-3">
              {Object.keys(equipmentChecks).map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`eq-${item}`}
                    checked={equipmentChecks[item]}
                    onCheckedChange={() => toggleEquipment(item)}
                  />
                  <label
                    htmlFor={`eq-${item}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Urgent Items</Label>
            <Textarea
              value={urgent}
              onChange={(e) => setUrgent(e.target.value)}
              placeholder="Any critical issues for next shift..."
              className="border-red-200 focus-visible:ring-red-500"
            />
          </div>

          <div className="space-y-2">
            <Label>General Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context or observations..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Handover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
