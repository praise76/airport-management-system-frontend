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
import { ArrowLeft, Loader2 } from "lucide-react";
import type { CreateStaffInput } from "@/types/staff";

export const Route = createFileRoute("/admin/staff/new")({
  component: NewStaffPage,
});

function NewStaffPage() {
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
    },
  });

  const selectedRole = watch("role");
  const selectedRoleInfo = roles?.find((r) => r.value === selectedRole);

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

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
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
