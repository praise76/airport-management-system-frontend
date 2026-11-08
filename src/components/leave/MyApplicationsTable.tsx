import { LeaveApplication } from "@/types/leave";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, XCircle } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelLeaveRequest } from "@/api/self-service";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface MyApplicationsTableProps {
  applications: LeaveApplication[];
  loading?: boolean;
  onViewDetails?: (application: LeaveApplication) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
      );
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25"
        >
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function MyApplicationsTable({
  applications,
  loading,
  onViewDetails,
}: MyApplicationsTableProps) {
  // QA finding LV-06: applicants had no way to withdraw a pending request.
  const qc = useQueryClient();
  const [toCancel, setToCancel] = useState<LeaveApplication | null>(null);
  const cancel = useMutation({
    mutationFn: (id: string) => cancelLeaveRequest(id, "Withdrawn by applicant"),
    onSuccess: () => {
      toast.success("Leave request cancelled");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
      setToCancel(null);
    },
    onError: (e: any) => toast.error(e?.message || "Couldn't cancel the request"),
  });
  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Loading applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/5">
        No leave applications found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>App No</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">
                {app.applicationNumber}
              </TableCell>
              <TableCell>{app.leaveType}</TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{format(new Date(app.startDate), "MMM dd, yyyy")}</span>
                  <span className="text-muted-foreground text-xs">
                    to {format(new Date(app.endDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </TableCell>
              <TableCell>{app.days}</TableCell>
              <TableCell>{getStatusBadge(app.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {app.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToCancel(app)}
                      aria-label={`Cancel leave request ${app.applicationNumber}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails?.(app)}
                    aria-label={`View leave request ${app.applicationNumber}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={!!toCancel}
        onOpenChange={(o) => !o && setToCancel(null)}
        title="Cancel this leave request?"
        description={toCancel ? `${toCancel.leaveType} leave, ${toCancel.startDate} to ${toCancel.endDate}. Your approvers will no longer see it.` : ""}
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id)}
      />
    </div>
  );
}
