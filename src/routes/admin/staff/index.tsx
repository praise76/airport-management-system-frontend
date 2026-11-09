import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStaff, useDeactivateStaff } from "@/hooks/staff";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Edit, UserX, Search, FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { label } from "@/lib/labels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StaffImportDialog } from "@/components/staff/StaffImportDialog";

export const Route = createFileRoute("/admin/staff/")({
  beforeLoad: requireStaff(ROLE_GROUPS.staffAdmins),
  component: StaffListPage,
});

function StaffListPage() {
  const navigate = useNavigate();
  const { data: staff, isLoading } = useStaff();
  const deactivateMutation = useDeactivateStaff();
  const [showImport, setShowImport] = useState(false);

  const handleDeactivate = (id: string) => {
    deactivateMutation.mutate(id);
  };

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const departments = useMemo(
    () =>
      [...new Set((staff ?? []).map((m) => m.department?.name).filter(Boolean) as string[])].sort(),
    [staff],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (staff ?? []).filter(
      (m) =>
        (showInactive || m.isActive) &&
        (!dept || m.department?.name === dept) &&
        (!needle ||
          `${m.firstName} ${m.lastName} ${m.email} ${m.employeeId ?? ""}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [staff, q, dept, showInactive]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff members and their roles
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => navigate({ to: "/admin/staff/new" })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or staff ID"
            className="pl-8"
          />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          aria-label="Department"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show deactivated
        </label>
        <span className="ml-auto text-sm text-muted-foreground">
          {shown.length} of {staff?.length ?? 0} staff
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No staff match.
                  </TableCell>
                </TableRow>
              )}
              {shown.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{label(member.role)}</Badge>
                  </TableCell>
                  <TableCell>{member.employeeId || "-"}</TableCell>
                  <TableCell>{member.gradeLevel ? `GL ${member.gradeLevel}` : "-"}</TableCell>
                  <TableCell>{member.department?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={member.isActive ? "default" : "destructive"}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() =>
                          navigate({ to: "/admin/staff/$id/edit", params: { id: member.id } })
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {member.isActive && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Deactivate">
                              <UserX className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Deactivate Staff Member
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate{" "}
                                {member.firstName} {member.lastName}? They will
                                no longer be able to access the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeactivate(member.id)}
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <StaffImportDialog open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}
