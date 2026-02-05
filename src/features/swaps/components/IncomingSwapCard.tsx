import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SwapRequest } from "@/types/swaps";
import { format } from "date-fns";
import { useRespondToSwap } from "@/hooks/swaps";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface IncomingSwapCardProps {
  request: SwapRequest;
}

export function IncomingSwapCard({ request }: IncomingSwapCardProps) {
  const { mutate: respond, isPending } = useRespondToSwap();
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const handleAccept = () => {
    respond(
      { id: request.id, accepted: true },
      {
        onSuccess: () => toast.success("Swap request accepted"),
      },
    );
  };

  const handleDecline = () => {
    if (!declineReason) {
      toast.error("Please provide a reason for declining");
      return;
    }
    respond(
      { id: request.id, accepted: false, notes: declineReason },
      {
        onSuccess: () => {
          toast.success("Swap request declined");
          setShowDeclineReason(false);
        },
      },
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              From: {request.requestingStaffId}{" "}
              {/* Ideally this should be a name resolved from ID or included in payload */}
            </CardTitle>
            <CardDescription>
              Wants your:{" "}
              {format(new Date(request.originalDutyDate), "MMM dd, yyyy")} (
              {request.originalShift})
            </CardDescription>
          </div>
          {request.urgency === "urgent" && (
            <Badge variant="destructive">Urgent</Badge>
          )}
          {request.urgency === "emergency" && (
            <Badge variant="destructive" className="animate-pulse">
              Emergency
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Offers:</p>
            <p className="text-sm">
              {format(
                new Date(request.requesterGivesShift.date),
                "MMM dd, yyyy",
              )}{" "}
              ({request.requesterGivesShift.shift})
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Reason:</p>
            <p className="text-sm text-muted-foreground italic">
              "{request.reason}"
            </p>
          </div>
        </div>

        {showDeclineReason && (
          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeclineReason(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDecline}
                disabled={isPending}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {!showDeclineReason && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeclineReason(true)}>
            Decline
          </Button>
          <Button onClick={handleAccept} disabled={isPending}>
            Accept
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
