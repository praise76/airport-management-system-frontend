import { createFileRoute } from "@tanstack/react-router";
import { usePendingApprovals, useProcessApproval } from "@/hooks/leave";
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
import { Check, X, Calendar, Clock, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { ApprovalActionModal } from "@/components/leave/ApprovalActionModal";
import { LeaveApplication } from "@/types/leave";

export const Route = createFileRoute("/admin/leave/approvals")({
  component: LeaveApprovalsPage,
});

function LeaveApprovalsPage() {
  const { data: approvals, isLoading } = usePendingApprovals();
  const processMutation = useProcessApproval();

  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleAction = (app: LeaveApplication, act: "approve" | "reject") => {
    setSelectedApp(app);
    setAction(act);
  };

  const handleConfirmAction = (comments: string) => {
    if (selectedApp && action) {
      processMutation.mutate(
        { id: selectedApp.id, status: action, comments },
        {
          onSuccess: () => {
            setSelectedApp(null);
            setAction(null);
          },
        },
      );
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading approvals...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leave Approvals</h2>
        <p className="text-muted-foreground">
          Manaage pending leave requests from your team.
        </p>
      </div>

      {approvals?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/10 dashed">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Check className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground">
            No pending leave requests at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvals?.map((app) => (
            <Card key={app.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {app.staffName ? (
                        app.staffName[0]
                      ) : (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {app.staffName || "Unknown Staff"}
                      </CardTitle>
                      <CardDescription>{app.staffId}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{app.leaveType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(app.startDate), "MMM dd")} -{" "}
                      {format(new Date(app.endDate), "MMM dd")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{app.days} Days</span>
                  </div>
                </div>

                {app.handoverToUserId && (
                  <div className="text-sm bg-muted/30 p-2 rounded">
                    <span className="font-semibold text-xs uppercase text-muted-foreground">
                      Handover:
                    </span>
                    <div className="truncate">{app.handoverToUserId}</div>
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">
                    Reason:
                  </span>
                  <p className="text-foreground/90 line-clamp-3 italic">
                    "{app.reason}"
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => handleAction(app, "reject")}
                >
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAction(app, "approve")}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ApprovalActionModal
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        action={action}
        onConfirm={handleConfirmAction}
        isProcessing={processMutation.isPending}
      />
    </div>
  );
}
