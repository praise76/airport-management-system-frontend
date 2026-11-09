import { useId, useState } from "react";
import { TerminalCheckboxes } from "@/components/staff/TerminalCheckboxes";
import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useRoles, useCreateStaff } from "@/hooks/staff";
import { useAuthStore } from "@/stores/auth";
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
import { GRADE_LEVELS, annualLeaveDaysForGrade } from "@/lib/leavePolicy";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useDepartments, useDepartmentUnits } from "@/hooks/departments";
import type { CreateStaffInput } from "@/types/staff";

/** A 12-character password with letters, digits and a symbol, avoiding look-alike characters. */
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `${body.slice(0, 6)}-${body.slice(6)}`;
}

export const Route = createFileRoute("/admin/staff/new")({
  beforeLoad: requireStaff(ROLE_GROUPS.staffAdmins),
  component: NewStaffPage,
});

function NewStaffPage() {
  const stakeholderFlagId = useId();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const createMutation = useCreateStaff();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStaffInput>({
    defaultValues: {
      organizationId: user?.organizationId || "",
      canAssignDocuments: false,
      canRegisterDocuments: false,
      canManageStakeholders: false,
    },
  });

  const selectedRole = watch("role");
  const [showPassword, setShowPassword] = useState(false);
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
    // You might want to reset a unit field if you had one specifically for units
  };

  const onSubmit = async (data: CreateStaffInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate({ to: "/admin/staff" });
      },
    });
  };

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
          <CardTitle>Create New Staff Member</CardTitle>
          <CardDescription>
            Add a new staff member to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <select
                    id="gradeLevel"
                    {...register("gradeLevel", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="">Not set</option>
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        Grade {g} ({annualLeaveDaysForGrade(g)} days annual leave)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Sets annual leave: Grade 1-8 get 21 working days, Grade 9-16 get 30.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue("password", generatePassword(), { shouldValidate: true });
                    setShowPassword(true);
                  }}
                >
                  Generate
                </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Give this to the staff member in person or by SMS, never by email copy to others.
                  They should change it after their first sign-in.
                </p>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role & Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Role & Permissions</h3>

              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
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
                {errors.role && (
                  <p className="text-sm text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canAssignDocuments"
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
                  onCheckedChange={(checked) =>
                    setValue("canRegisterDocuments", checked as boolean)
                  }
                />
                <Label htmlFor="canRegisterDocuments" className="font-normal">
                  Can register documents
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id={stakeholderFlagId}
                  onCheckedChange={(checked) =>
                    setValue("canManageStakeholders", checked as boolean)
                  }
                />
                <div className="space-y-0.5">
                  <Label htmlFor={stakeholderFlagId} className="font-normal">
                    Can review stakeholder submissions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Verify companies and approve documents, permits and invoices. Suspending or
                    blacklisting stays with super admins.
                  </p>
                </div>
              </div>
            </div>

            {/* Department & Unit */}
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
                      {units?.data?.map((unit) => (
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

                <div className="space-y-2 col-span-2">
                  <Label>Assigned terminals</Label>
                  <TerminalCheckboxes
                    value={watch("assignedTerminals")}
                    onChange={(json) => setValue("assignedTerminals", json)}
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Staff Member
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
