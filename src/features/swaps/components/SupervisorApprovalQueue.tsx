import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReviewSwap } from "@/hooks/swaps"; // Assuming incoming swaps endpoint can be filtered for supervisor or a new hook is needed
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

import { useQuery } from "@tanstack/react-query";
import { getSwapApprovals } from "@/api/swaps";

const usePendingApprovals = () =>
  useQuery({
    queryKey: ["swaps", "approvals"],
    queryFn: getSwapApprovals,
    // A 403 won't fix itself; retrying left the tab on "Loading approvals..." for a long time.
    retry: (count, err: any) => err?.status !== 403 && count < 2,
  });

export function SupervisorApprovalQueue() {
  const { data: requests, isLoading, isError, error } = usePendingApprovals();
  const { mutate: review, isPending } = useReviewSwap();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  if (isLoading) return <div>Loading approvals...</div>;
  if (isError)
    return (
      <div className="p-4 text-destructive" role="alert">
        {(error as any)?.status === 403
          ? "Your account can't approve swaps. Ask an administrator to check your role."
          : "Couldn't load swap approvals. Please refresh the page."}
      </div>
    );
  if (!requests?.length)
    return (
      <div className="text-muted-foreground p-4">No pending approvals</div>
    );

  const handleApprove = (id: string) => {
    review(
      { id, approved: true },
      {
        onSuccess: () => toast.success("Swap approved"),
      },
    );
  };

  const handleReject = (id: string) => {
    if (!comments) {
      toast.error("Please add comments for rejection");
      return;
    }
    review(
      { id, approved: false, comments },
      {
        onSuccess: () => {
          toast.success("Swap rejected");
          setRejectId(null);
          setComments("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="p-4 pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {req.swapType.replace("_", " ").toUpperCase()}
                  </Badge>
                  {req.urgency === "emergency" && (
                    <Badge variant="destructive">EMERGENCY</Badge>
                  )}
                </div>
                <h4 className="font-semibold">
                  {req.requesterName ?? "Requester"} ↔ {req.targetName ?? (req.targetStaffId ? "Colleague" : "Marketplace")}
                </h4>
                <div className="text-sm mt-1 space-y-1">
                  <p>
                    Original: {format(new Date(req.originalDutyDate), "MMM dd")}{" "}
                    ({req.originalShift})
                  </p>
                  {req.requesterGivesShift && (
                    <p>
                      Offered:{" "}
                      {format(new Date(req.requesterGivesShift.date), "MMM dd")}{" "}
                      ({req.requesterGivesShift.shift})
                    </p>
                  )}
                </div>
                <p className="text-sm italic text-muted-foreground mt-2">
                  {req.reason ? `"${req.reason}"` : "No reason given."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {rejectId === req.id ? (
                  <div className="w-[300px] space-y-2">
                    <Textarea
                      placeholder="Rejection reason..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(req.id)}
                        disabled={isPending}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(req.id)}
                      disabled={isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectId(req.id)}
                      disabled={isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
