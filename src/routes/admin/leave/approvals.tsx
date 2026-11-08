import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute } from "@tanstack/react-router";
import { approvalLevelsFor, usePendingApprovals, useProcessApproval } from "@/hooks/leave";
import { useUsers } from "@/hooks/users";
import { useAuthStore } from "@/stores/auth";
import { label } from "@/lib/labels";
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
  beforeLoad: requireStaff(ROLE_GROUPS.supervisors),
  component: LeaveApprovalsPage,
});

function LeaveApprovalsPage() {
  const user = useAuthStore((s) => s.user);
  const levels = approvalLevelsFor(user);
  const { data: approvals, isLoading, isError, error } = usePendingApprovals();
  const processMutation = useProcessApproval();
  const { data: staff } = useUsers({ limit: 500 });
  const nameOf = (id?: string) => {
    const u = (staff?.data ?? []).find((x: any) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : undefined;
  };

  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleAction = (app: LeaveApplication, act: "approve" | "reject") => {
    setSelectedApp(app);
    setAction(act);
  };

  const handleConfirmAction = (comments: string) => {
    if (selectedApp && action) {
      processMutation.mutate(
        {
          id: selectedApp.id,
          level: selectedApp.level ?? levels[0] ?? "supervisor",
          decision: action,
          comments,
        },
        {
          onSuccess: () => {
            setSelectedApp(null);
            setAction(null);
          },
        },
      );
    }
  };

  if (levels.length === 0) {
    return (
      <div className="p-8 text-muted-foreground">
        Your role doesn't approve leave. Supervisors, heads of unit or department, and HR do.
      </div>
    );
  }
  if (isLoading) {
    return <div className="p-8">Loading approvals…</div>;
  }
  if (isError) {
    return (
      <div className="p-8 text-destructive" role="alert">
        {(error as Error | null)?.message?.includes("approval queue")
          ? (error as Error).message
          : "Couldn't load leave requests. Please refresh the page."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leave Approvals</h2>
        <p className="text-muted-foreground">
          Leave requests waiting for your decision.
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
                      {(app.staffName || nameOf(app.staffId)) ? (
                        (app.staffName || nameOf(app.staffId) || "?")[0]
                      ) : (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {app.staffName || nameOf(app.staffId) || "Name not available"}
                      </CardTitle>
                      <CardDescription>
                        Applied {app.createdAt ? format(new Date(app.createdAt), "d MMM") : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">{app.leaveType}</Badge>
                    {app.level && (
                      <span className="text-[11px] text-muted-foreground">
                        {label(app.level)} approval
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(app.startDate), "d MMM")} – {format(new Date(app.endDate), "d MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {app.days} working {app.days === 1 ? "day" : "days"}
                    </span>
                  </div>
                </div>

                {(app.handoverToName || app.handoverToUserId) && (
                  <div className="text-sm bg-muted/30 p-2 rounded">
                    <span className="font-semibold text-xs uppercase text-muted-foreground">
                      Handover:
                    </span>
                    <div className="truncate">
                      {app.handoverToName || nameOf(app.handoverToUserId) || "Colleague (name not available)"}
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">
                    Reason:
                  </span>
                  <p className="text-foreground/90 line-clamp-3 italic">
                    {app.reason ? `"${app.reason}"` : "No reason given."}
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
