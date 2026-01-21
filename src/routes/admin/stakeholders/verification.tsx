import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useStakeholderOrgs } from "@/hooks/stakeholder-portal";
import {
  StakeholderStatusBadge,
  StakeholderTypeIcon,
} from "@/components/stakeholders";
import { getStakeholderTypeLabel } from "@/types/stakeholder-portal";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/stakeholders/verification")({
  component: AdminVerificationQueuePage,
});

function AdminVerificationQueuePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Fetch only pending verification organizations
  const { data, isLoading, error } = useStakeholderOrgs({
    page,
    limit: 20,
    search: searchQuery,
    status: "pending_verification",
  });

  const items = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Admin Verification Queue
          </h1>
          <p className="text-muted-foreground">
            Review and verify pending stakeholder registrations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">Export List</Button>
        </div>
      </div>

      {/* Stats Cards - Optional quick view */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        {/* Add more stats if needed */}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="border rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading queue...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                    <p>All caught up! No pending verifications.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <StakeholderTypeIcon
                        type={org.stakeholderType}
                        className="h-8 w-8 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                      />
                      <div>
                        <p className="font-medium">{org.organizationName}</p>
                        <p className="text-xs text-muted-foreground">
                          {org.registrationNumber || "No Reg No."}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {getStakeholderTypeLabel(org.stakeholderType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{org.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">
                        {org.contactEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(org.createdAt), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(org.createdAt), "h:mm a")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StakeholderStatusBadge status={org.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/stakeholders/$stakeholderId"
                      params={{ stakeholderId: org.id }}
                    >
                      <Button size="sm">
                        Review
                        <Eye className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Simplified */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
