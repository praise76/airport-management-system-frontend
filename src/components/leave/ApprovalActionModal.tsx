import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ApprovalActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject" | null;
  onConfirm: (comments: string) => void;
  isProcessing?: boolean;
}

export function ApprovalActionModal({
  open,
  onOpenChange,
  action,
  onConfirm,
  isProcessing,
}: ApprovalActionModalProps) {
  const [comments, setComments] = useState("");

  const handleConfirm = () => {
    onConfirm(comments);
    setComments("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action === "approve"
              ? "Approve Application"
              : "Reject Application"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "Are you sure you want to approve this leave request? You can add optional comments below."
              : "Please provide a reason for rejecting this leave request."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder={
              action === "approve"
                ? "Optional comments..."
                : "Reason for rejection (required)..."
            }
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={action === "reject" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={
              isProcessing ||
              (action === "reject" && comments.trim().length < 5)
            }
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
