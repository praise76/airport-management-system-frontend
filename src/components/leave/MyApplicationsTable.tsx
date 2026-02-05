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
import { Eye } from "lucide-react";

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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails?.(app)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
