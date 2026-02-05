import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReviewSwap } from "@/hooks/swaps"; // Assuming incoming swaps endpoint can be filtered for supervisor or a new hook is needed
import { SwapRequest } from "@/types/swaps";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

// NOTE: Ideally we'd have a specific `useSupervisorPendingSwaps` hook.
// For now, I'll simulate it or assume `useIncomingSwaps` can handle it if parameterized.
// I'll assume a new hook `usePendingApprovals` for clarity in this file,
// even if I have to add it to hooks/swaps.ts later or mock it here.
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

const usePendingApprovals = () => {
  return useQuery({
    queryKey: ["swaps", "approvals"],
    queryFn: async () => {
      const res = await api.get("/roster/swaps/approvals");
      return res.data.data as SwapRequest[];
    },
  });
};

export function SupervisorApprovalQueue() {
  const { data: requests, isLoading } = usePendingApprovals();
  const { mutate: review, isPending } = useReviewSwap();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  if (isLoading) return <div>Loading approvals...</div>;
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
                  {req.requestingStaffId} ↔ {req.targetStaffId || "Marketplace"}
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
                  "{req.reason}"
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
