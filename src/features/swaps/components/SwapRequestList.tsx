import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMySwapRequests, useCancelSwap } from "@/hooks/swaps";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function SwapRequestList() {
  const { data: requests, isLoading } = useMySwapRequests();
  const { mutate: cancel, isPending: isCanceling } = useCancelSwap();

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p>No active swap requests</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_target":
      case "pending_supervisor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
      case "cancelled":
      case "target_declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "target_accepted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCancel = (id: string) => {
    cancel(
      { id, reason: "User cancelled" },
      {
        onSuccess: () => toast.success("Request cancelled"),
      },
    );
  };

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id} className="overflow-hidden">
          <div
            className={`h-1 w-full ${getStatusColor(req.status).split(" ")[0]}`}
          />
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {req.requestNumber}
                  </span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(req.status)}
                  >
                    {req.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  {req.urgency === "urgent" && (
                    <Badge variant="destructive" className="h-5 text-[10px]">
                      URGENT
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium mt-1">
                  {format(new Date(req.originalDutyDate), "MMM dd")} •{" "}
                  {req.originalShift}
                  <span className="text-muted-foreground font-normal"> → </span>
                  {req.targetStaff
                    ? `${req.targetStaff.firstName} ${req.targetStaff.lastName}`
                    : "Any / Marketplace"}
                </h4>
              </div>
              {["pending_target", "pending_supervisor", "open"].includes(
                req.status,
              ) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleCancel(req.id)}
                  disabled={isCanceling}
                >
                  Cancel
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground italic">
              "{req.reason}"
            </p>

            {req.expiresAt && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Expires: {format(new Date(req.expiresAt), "MMM dd, HH:mm")}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
