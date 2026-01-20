import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus, Search, Trash, Edit } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { useUsers, useDeleteUser } from "@/hooks/users";
import { useDepartmentTree } from "@/hooks/departments";
import { DepartmentSelector, DepartmentLevelIndicator } from "@/components/departments";
import { DepartmentTreeNode, DepartmentLevel } from "@/types/department";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRegisterMutation } from "@/hooks/auth";
import { useUiStore } from "@/stores/ui";
import { getAccessToken } from "@/utils/auth";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/users/")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined")
      throw redirect({ to: "/auth/login" });
  },
  component: UsersPage,
});

function UsersPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const selectedOrganizationId = useUiStore((state) => state.selectedOrganizationId);
  const { data, isLoading } = useUsers({ 
    page: 1, 
    limit: 100, 
    departmentId: departmentFilter || undefined 
  });
  
  const { data: deptTree } = useDepartmentTree(selectedOrganizationId || undefined);
  const deleteMutation = useDeleteUser();

  // Create a lookup map for department details
  const deptLookup = useMemo(() => {
    const map = new Map<string, { name: string; path: string[]; level: DepartmentLevel }>();
    if (!deptTree) return map;

    const walk = (nodes: DepartmentTreeNode[], currentPath: string[]) => {
      for (const node of nodes) {
        const path = [...currentPath, node.name];
        map.set(node.id, { 
          name: node.name, 
          path, 
          level: node.departmentLevel 
        });
        if (node.children) {
          walk(node.children, path);
        }
      }
    };

    walk(deptTree, []);
    return map;
  }, [deptTree]);

  const filteredUsers = useMemo(() => {
    return data?.data.filter((user) =>
      (user.firstName + " " + user.lastName + " " + user.email)
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage staff access, roles, and assignments</p>
        </div>
        <CreateUserDialog organizationId={selectedOrganizationId || ""} />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-[300px]">
          <DepartmentSelector
            value={departmentFilter}
            onChange={setDepartmentFilter}
            organizationId={selectedOrganizationId || undefined}
            placeholder="Filter by department..."
            clearable
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
              <th className="px-6 py-4 font-medium">Department</th>
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
                  No users found matching your criteria.
                </td>
              </tr>
            )}
            {filteredUsers?.map((user) => {
              const deptInfo = user.departmentId ? deptLookup.get(user.departmentId) : null;
              
              return (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <StatusPill status={user.role} />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {deptInfo ? (
                      <div className="flex items-center gap-2" title={deptInfo.path.join(" > ")}>
                        <DepartmentLevelIndicator level={deptInfo.level} />
                        <span className="truncate max-w-[200px]">{deptInfo.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
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
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CreateUserDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useRegisterMutation();
  const { register, handleSubmit, control, reset } = useForm();

  const onSubmit = async (data: any) => {
     if (!organizationId) {
        toast.error("No organization selected");
        return;
     }
     
     try {
       await mutateAsync({ 
         ...data, 
         organizationId,
         // Ensure departmentId is set, or undefined/null if unused
         departmentId: data.departmentId || undefined
       }); 
       setOpen(false);
       reset();
       toast.success("User created successfully");
     } catch (error) {
        // Error handling is done in mutation
     }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={!organizationId}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>First Name</Label>
               <Input {...register("firstName")} required placeholder="John" />
             </div>
             <div className="space-y-2">
               <Label>Last Name</Label>
               <Input {...register("lastName")} required placeholder="Doe" />
             </div>
           </div>
           
           <div className="space-y-2">
             <Label>Email</Label>
             <Input {...register("email")} type="email" required placeholder="john.doe@example.com" />
           </div>
           
           <div className="space-y-2">
             <Label>Password</Label>
             <Input {...register("password")} type="password" required />
           </div>
           
           <div className="space-y-2">
             <Label>Role</Label>
             <Input {...register("role")} defaultValue="staff" placeholder="e.g. admin, staff" />
           </div>

           <div className="space-y-2">
             <Label>Department</Label>
             <Controller
               control={control}
               name="departmentId"
               render={({ field }) => (
                 <DepartmentSelector
                   value={field.value}
                   onChange={field.onChange}
                   organizationId={organizationId}
                   placeholder="Assign to department..."
                 />
               )}
             />
           </div>

           <Button type="submit" className="w-full" disabled={isPending}>
             {isPending ? "Creating..." : "Create User"}
           </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
