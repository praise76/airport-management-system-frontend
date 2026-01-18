import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useRegisterMutation } from "@/hooks/auth";
import { getAccessToken } from "@/utils/auth";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationId: z.string().uuid("Invalid Organization ID"),
  departmentId: z.string().uuid("Invalid Department ID"),
  role: z.string().min(1, "Role is required"),
});

export const Route = createFileRoute("/auth/register")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (token && typeof window !== "undefined") throw redirect({ to: "/" });
  },
  component: RegisterPage,
});

type FormValues = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useRegisterMutation();
  const { register, handleSubmit, formState, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationId: "",
      departmentId: "",
      role: "staff",
    },
  });

  async function onSubmit(values: FormValues) {
    await mutateAsync(values);
    navigate({ to: "/auth/login" });
  }

  const role = watch("role");

  return (
    <div className="min-h-[80dvh] grid place-items-center py-10">
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Create an Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Join the Airport Management System
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {formState.errors.firstName && (
                <p className="text-xs text-red-500">
                  {formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {formState.errors.lastName && (
                <p className="text-xs text-red-500">
                  {formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {formState.errors.email && (
              <p className="text-xs text-red-500">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {formState.errors.password && (
              <p className="text-xs text-red-500">
                {formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input id="organizationId" {...register("organizationId")} placeholder="UUID" />
              {formState.errors.organizationId && (
                <p className="text-xs text-red-500">
                  {formState.errors.organizationId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department ID</Label>
              <Input id="departmentId" {...register("departmentId")} placeholder="UUID" />
              {formState.errors.departmentId && (
                <p className="text-xs text-red-500">
                  {formState.errors.departmentId.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select onValueChange={(val) => setValue("role", val)} defaultValue={role}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {formState.errors.role && (
              <p className="text-xs text-red-500">
                {formState.errors.role.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Creating account…" : "Register"}
          </Button>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/auth/login" className="underline hover:text-primary">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

