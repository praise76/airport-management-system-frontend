import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useRoles, useStaffById, useUpdateStaff } from "@/hooks/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useDepartments, useDepartmentUnits } from "@/hooks/departments";
import type { UpdateStaffInput } from "@/types/staff";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/staff/$id/edit")({
  component: EditStaffPage,
});

function EditStaffPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: staff, isLoading: staffLoading } = useStaffById(id);
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const updateMutation = useUpdateStaff();

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<UpdateStaffInput>();

  const selectedRole = watch("role");
  const selectedRoleInfo = roles?.find((r) => r.value === selectedRole);

  const selectedDeptId = watch("departmentId");
  const { data: departments, isLoading: departmentsLoading } = useDepartments({
    limit: 100,
  });
  const { data: units, isLoading: unitsLoading } = useDepartmentUnits(
    selectedDeptId || "",
  );

  const handleDepartmentChange = (value: string) => {
    setValue("departmentId", value);
  };

  // Populate form when staff data loads
  useEffect(() => {
    if (staff) {
      reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        employeeId: staff.employeeId,
        role: staff.role,
        departmentId: staff.departmentId,
        reportsToUserId: staff.reportsToUserId,
        isActive: staff.isActive,
        canAssignDocuments: staff.canAssignDocuments,
        canRegisterDocuments: staff.canRegisterDocuments,
        assignedTerminals: staff.assignedTerminals,
        airportCode: staff.airportCode,
      });
    }
  }, [staff, reset]);

  const onSubmit = async (data: UpdateStaffInput) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          navigate({ to: "/admin/staff" });
        },
      },
    );
  };

  if (staffLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="container mx-auto py-6">
        <p>Staff member not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate({ to: "/admin/staff" })}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Staff List
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Staff Member</CardTitle>
          <CardDescription>
            Update {staff.firstName} {staff.lastName}'s information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={staff.email} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register("firstName")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register("lastName")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" {...register("phone")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" {...register("employeeId")} />
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Role & Permissions</h3>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={watch("role")}
                  onValueChange={(value) => setValue("role", value)}
                  disabled={rolesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoleInfo && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRoleInfo.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canAssignDocuments"
                  checked={watch("canAssignDocuments")}
                  onCheckedChange={(checked) =>
                    setValue("canAssignDocuments", checked as boolean)
                  }
                />
                <Label htmlFor="canAssignDocuments" className="font-normal">
                  Can assign documents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canRegisterDocuments"
                  checked={watch("canRegisterDocuments")}
                  onCheckedChange={(checked) =>
                    setValue("canRegisterDocuments", checked as boolean)
                  }
                />
                <Label htmlFor="canRegisterDocuments" className="font-normal">
                  Can register documents
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked as boolean)
                  }
                />
                <Label htmlFor="isActive" className="font-normal">
                  Active
                </Label>
              </div>
            </div>

            {/* Organization Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Organization Structure</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    onValueChange={handleDepartmentChange}
                    value={selectedDeptId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          departmentsLoading
                            ? "Loading..."
                            : "Select Department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.data
                        .filter((d) => d.departmentLevel === 1)
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unit (Optional)</Label>
                  <Select
                    onValueChange={(value) => setValue("departmentId", value)}
                    disabled={!selectedDeptId || unitsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedDeptId
                            ? "Select Dept first"
                            : unitsLoading
                              ? "Loading..."
                              : "Select Unit"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airportCode">Airport Code</Label>
                  <Input id="airportCode" {...register("airportCode")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTerminals">
                    Assigned Terminals (JSON)
                  </Label>
                  <Input
                    id="assignedTerminals"
                    placeholder='["IT1", "IT2"]'
                    {...register("assignedTerminals")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/admin/staff" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update Staff Member
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
