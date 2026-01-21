import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetShiftDefinitions,
  useCreateShiftDefinition,
  useUpdateShiftDefinition,
  useDeleteShiftDefinition,
} from "../api";
import { ShiftDefinition } from "../types";
import { Plus, Trash2, Edit2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ShiftManagerProps {
  unitId?: string;
  trigger?: React.ReactNode;
}

export function ShiftManager({ unitId, trigger }: ShiftManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);

  const { data: shifts, isLoading } = useGetShiftDefinitions({ unitId });
  const createMutation = useCreateShiftDefinition();
  const updateMutation = useUpdateShiftDefinition();
  const deleteMutation = useDeleteShiftDefinition();

  const handleEdit = (shift: ShiftDefinition) => {
    setEditingShift(shift);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this shift definition?")) {
      await deleteMutation.mutateAsync(id);
      toast.success("Shift deleted");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Manage Shifts</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Shift Definitions</DialogTitle>
          <DialogDescription>
            Configure standard shifts for this unit to speed up roster creation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* List of existing shifts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">
                Available Shifts ({shifts?.length || 0})
              </h3>
              {!isCreating && !editingShift && (
                <Button size="sm" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Shift
                </Button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading shifts...</p>
            ) : shifts?.length === 0 && !isCreating ? (
              <div className="text-center py-8 border rounded-lg border-dashed">
                <p className="text-muted-foreground mb-2">
                  No shifts defined yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                >
                  Create your first shift
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {shifts?.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-10 rounded-full"
                        style={{ backgroundColor: shift.color || "#3b82f6" }}
                      />
                      <div>
                        <p className="font-medium">{shift.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <Clock className="h-3 w-3" />
                          {shift.startTime.slice(0, 5)} -{" "}
                          {shift.endTime.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(shift)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(shift.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form for Creating/Editing */}
          {(isCreating || editingShift) && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">
                {isCreating ? "Create New Shift" : "Edit Shift"}
              </h3>
              <ShiftForm
                initialData={editingShift || undefined}
                unitId={unitId}
                onSubmit={async (data) => {
                  try {
                    if (editingShift) {
                      await updateMutation.mutateAsync({
                        id: editingShift.id,
                        updates: data,
                      });
                      toast.success("Shift updated");
                    } else {
                      await createMutation.mutateAsync(data);
                      toast.success("Shift created");
                    }
                    setIsCreating(false);
                    setEditingShift(null);
                  } catch (e) {
                    toast.error("Failed to save shift");
                  }
                }}
                onCancel={() => {
                  setIsCreating(false);
                  setEditingShift(null);
                }}
                isSubmitting={
                  createMutation.isPending || updateMutation.isPending
                }
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShiftForm({
  initialData,
  unitId,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData?: Partial<ShiftDefinition>;
  unitId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      startTime: initialData?.startTime || "09:00",
      endTime: initialData?.endTime || "17:00",
      color: initialData?.color || "#3b82f6",
      unitId: unitId || initialData?.unitId,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Shift Name</Label>
          <Input
            id="name"
            placeholder="e.g. Morning A"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-xs text-destructive">
              {errors.name.message as string}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              {...register("startTime", { required: true })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              {...register("endTime", { required: true })}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="color">Color Code</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              className="w-12 h-10 p-1"
              {...register("color")}
            />
            <Input
              placeholder="#000000"
              {...register("color")}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Shift"
              : "Create Shift"}
        </Button>
      </div>
    </form>
  );
}
