import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Trash, Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { useUsers, useDeleteUser } from "@/hooks/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Assuming Dialog exists as seen in file list
import { Label } from "@/components/ui/label";
import { useRegisterMutation } from "@/hooks/auth"; // Using register for "Create User" effectively

export const Route = createFileRoute("/users/")({
  component: UsersPage,
});

function UsersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers({ page: 1, limit: 50 }); // Simplified pagination
  const deleteMutation = useDeleteUser();

  const filteredUsers = data?.data.filter((user) =>
    (user.firstName + " " + user.lastName + " " + user.email)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage staff access and roles</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-xl bg-[var(--color-surface)] overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Org ID</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            )}
            {!isLoading && filteredUsers?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
            {filteredUsers?.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <StatusPill status={user.role} />
                </td>
                <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                  {user.organizationId.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                       <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      onClick={() => {
                        if(confirm('Are you sure?')) deleteMutation.mutate(user.id)
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useRegisterMutation(); // Reusing register for admins to add users
  const { register, handleSubmit } = useForm();

  // Very simplified creation form for speed
  const onSubmit = async (data: any) => {
     await mutateAsync({ ...data, organizationId: "default-org-id", departmentId: "default-dept-id" }); // Placeholder IDs
     setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="space-y-2">
             <Label>First Name</Label>
             <Input {...register("firstName")} required />
           </div>
           <div className="space-y-2">
             <Label>Last Name</Label>
             <Input {...register("lastName")} required />
           </div>
           <div className="space-y-2">
             <Label>Email</Label>
             <Input {...register("email")} type="email" required />
           </div>
           <div className="space-y-2">
             <Label>Password</Label>
             <Input {...register("password")} type="password" required />
           </div>
           <div className="space-y-2">
             <Label>Role</Label>
             <Input {...register("role")} defaultValue="staff" />
           </div>
           <Button type="submit" className="w-full" disabled={isPending}>Create User</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
