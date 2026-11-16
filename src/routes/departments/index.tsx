import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  UserCircle,
  Users,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useArchiveDepartment,
  useAssignHOD,
  useCreateDepartment,
  useDeleteDepartment,
  useDepartmentTree,
  useRestoreDepartment,
} from "@/hooks/departments";
import { ColleaguePicker } from "@/components/staff/ColleaguePicker";
import { useUiStore } from "@/stores/ui";
import { useAuthStore } from "@/stores/auth";
import type {
  DepartmentFormData,
  DepartmentLevel,
  DepartmentTreeNode,
} from "@/types/department";
import {
  getDepartmentLevelLabel,
  parseTerminalCodes,
} from "@/types/department";
import { getAccessToken } from "@/utils/auth";
import {
  DepartmentBadge,
  DepartmentLevelIndicator,
  DepartmentRowActions,
} from "@/components/departments";
import { prepareCreateRequest } from "@/api/departments";

export const Route = createFileRoute("/departments/")({
  beforeLoad: () => {
    const token = getAccessToken();
    if (!token && typeof window !== "undefined")
      throw redirect({ to: "/auth/login" });
  },
  component: DepartmentsPage,
});

// Form state type
interface FormState extends DepartmentFormData {
  isEditing: boolean;
  editingId?: string;
}

const initialFormState: FormState = {
  name: "",
  code: "",
  departmentLevel: 1,
  parentDepartmentId: null,
  headUserId: null,
  locationDetails: null,
  airportCode: null,
  terminalCodes: [],
  description: null,
  isRegistry: false,
  isEditing: false,
};

function DepartmentsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: tree, isLoading, error } = useDepartmentTree(undefined, showArchived);
  const selectedOrganizationId = useUiStore((s) => s.selectedOrganizationId);
  const user = useAuthStore((s) => s.user);
  
  // Effective organization ID used for operations
  const organizationId = selectedOrganizationId || user?.organizationId;


  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [assignHODDialog, setAssignHODDialog] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentTreeNode | null>(
    null,
  );
  const [hodUserId, setHodUserId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<DepartmentTreeNode | null>(null);
  const [departmentToArchive, setDepartmentToArchive] =
    useState<DepartmentTreeNode | null>(null);

  // IDs for form elements
  const nameInputId = useId();
  const codeInputId = useId();
  const parentInputId = useId();
  const descriptionInputId = useId();
  const locationInputId = useId();
  const registryInputId = useId();
  const hodSelectId = useId();

  // Mutations
  const createMutation = useCreateDepartment();
  const assignMutation = useAssignHOD();
  const deleteMutation = useDeleteDepartment();
  const archiveMutation = useArchiveDepartment();
  const restoreMutation = useRestoreDepartment();

  // Get parent options based on the selected level
  const parentOptions = useMemo(() => {
    if (!tree) return [];
    const result: Array<{ id: string; label: string; level: DepartmentLevel }> =
      [];

    const walk = (nodes: DepartmentTreeNode[], depth: number) => {
      for (const node of nodes) {
        // For Level 2 (Unit), parent must be Level 1 (Department)
        // For Level 3 (Station), parent must be Level 2 (Unit)
        const validParentLevel =
          formState.departmentLevel === 2
            ? node.departmentLevel === 1
            : formState.departmentLevel === 3
              ? node.departmentLevel === 2
              : false;

        if (validParentLevel && !node.archivedAt) {
          result.push({
            id: node.id,
            label: `${"— ".repeat(depth)}${node.name} (${node.code})`,
            level: node.departmentLevel,
          });
        }

        if (node.children && node.children.length > 0) {
          walk(node.children, depth + 1);
        }
      }
    };
    walk(tree, 0);
    return result;
  }, [tree, formState.departmentLevel]);

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const openCreateDialog = (
    level: DepartmentLevel,
    parentId?: string | null,
  ) => {
    setFormState({
      ...initialFormState,
      departmentLevel: level,
      parentDepartmentId: parentId ?? null,
    });
    setFormDialogOpen(true);
  };

  const openEditDialog = (node: DepartmentTreeNode) => {
    setFormState({
      name: node.name,
      code: node.code,
      departmentLevel: node.departmentLevel,
      parentDepartmentId: node.parentDepartmentId,
      headUserId: node.headUserId,
      locationDetails: node.locationDetails,
      terminalCodes: parseTerminalCodes(node.terminalCodes),
      airportCode: node.airportCode,
      description: node.description,
      isRegistry: node.isRegistry,
      isEditing: true,
      editingId: node.id,
    });
    setFormDialogOpen(true);
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!tree) return;
    const allIds = new Set<string>();
    const collectIds = (nodes: DepartmentTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(tree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSubmit = async () => {
    if (!organizationId) {
      toast.error("Select an organization before creating a department.");
      return;
    }

    if (formState.isEditing && formState.editingId) {
      // Update existing - would use useUpdateDepartment hook
      toast.info("Edit functionality coming soon");
      setFormDialogOpen(false);
      resetForm();
      return;
    }

    // Create new
    if (!organizationId) {
      toast.error("Organization ID is missing.");
      return;
    }

    const request = prepareCreateRequest(formState, organizationId);
    await createMutation.mutateAsync(request);
    setFormDialogOpen(false);
    resetForm();
  };

  const handleAssignHOD = async () => {
    if (!selectedDept) return;
    await assignMutation.mutateAsync({
      id: selectedDept.id,
      input: { hodUserId: hodUserId },
    });
    setAssignHODDialog(false);
    setHodUserId("");
    setSelectedDept(null);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    try {
      await deleteMutation.mutateAsync(departmentToDelete.id);
    } catch {
      // The reason (still in use, and what by) is already on screen as a toast.
    }
    setDeleteConfirmOpen(false);
    setDepartmentToDelete(null);
  };

  const handleArchive = async () => {
    if (!departmentToArchive) return;
    try {
      await archiveMutation.mutateAsync(departmentToArchive.id);
    } catch {
      // The reason (who or what is still in it) is already on screen as a toast.
    }
    setDepartmentToArchive(null);
  };

  const renderTree = (nodes: DepartmentTreeNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-2 p-3 hover:bg-muted/30 rounded-lg transition-colors group ${node.archivedAt ? "opacity-60" : ""}`}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Level Icon */}
            <DepartmentLevelIndicator level={node.departmentLevel} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{node.name}</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {node.code}
                </Badge>
                <DepartmentBadge
                  level={node.departmentLevel}
                  size="sm"
                  showLabel
                />
                {node.isRegistry && (
                  <Badge variant="outline" className="text-xs">
                    Registry
                  </Badge>
                )}
                {node.archivedAt && (
                  <Badge variant="outline" className="text-xs">
                    Archived
                  </Badge>
                )}
                {node.employeeCount !== undefined && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {node.employeeCount}
                  </span>
                )}
              </div>
              {node.hod && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <UserCircle className="h-3 w-3" />
                  {node.departmentLevel === 2 ? "HOU" : "HOD"}: {node.hod.name}
                </div>
              )}
              {node.locationDetails && (
                <div className="text-xs text-muted-foreground mt-1">
                  📍 {node.locationDetails}
                </div>
              )}
            </div>

            {/* Actions */}
            <DepartmentRowActions
              node={node}
              restoring={restoreMutation.isPending}
              onAddUnit={() => openCreateDialog(2, node.id)}
              onAddStation={() => openCreateDialog(3, node.id)}
              onEdit={() => openEditDialog(node)}
              onAssignHead={() => {
                setSelectedDept(node);
                setAssignHODDialog(true);
              }}
              onArchive={() => setDepartmentToArchive(node)}
              onDelete={() => {
                setDepartmentToDelete(node);
                setDeleteConfirmOpen(true);
              }}
              onRestore={() => restoreMutation.mutate(node.id)}
            />
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div>{renderTree(node.children ?? [], level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizational hierarchy: Departments → Units → Stations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived
          </label>
          <Button
            type="button"
            onClick={() => openCreateDialog(1)}
            disabled={!organizationId}
          >
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <DepartmentBadge level={1} size="sm" />
          <span className="text-muted-foreground">Top-level department</span>
        </div>
        <div className="flex items-center gap-2">
          <DepartmentBadge level={2} size="sm" />
          <span className="text-muted-foreground">Unit within department</span>
        </div>
        <div className="flex items-center gap-2">
          <DepartmentBadge level={3} size="sm" />
          <span className="text-muted-foreground">Station/Bit location</span>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading departments...
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          Failed to load departments
        </div>
      )}

      {tree && tree.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No departments found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first department
          </p>
          <Button
            type="button"
            onClick={() => openCreateDialog(1)}
            disabled={!selectedOrganizationId}
          >
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </div>
      )}

      {tree && tree.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Organization Structure</h2>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={expandedNodes.size > 0 ? collapseAll : expandAll}
              >
                {expandedNodes.size > 0 ? "Collapse All" : "Expand All"}
              </Button>
            </div>
          </div>
          <div className="space-y-1">{renderTree(tree)}</div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>
              {formState.isEditing
                ? `Edit ${getDepartmentLevelLabel(formState.departmentLevel)}`
                : `Create ${getDepartmentLevelLabel(formState.departmentLevel)}`}
            </DialogTitle>
            <DialogDescription>
              {formState.departmentLevel === 1 &&
                "Top-level organizational department (e.g., Aviation Security)"}
              {formState.departmentLevel === 2 &&
                "A unit within a department (e.g., Passenger Control)"}
              {formState.departmentLevel === 3 &&
                "A physical station or location (e.g., Terminal 1 Departure)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!organizationId && (
              <p className="text-sm text-destructive">
                Select an organization from the header first.
              </p>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor={nameInputId}>Name *</Label>
              <Input
                id={nameInputId}
                value={formState.name}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder={
                  formState.departmentLevel === 1
                    ? "e.g., Aviation Security (AVSEC)"
                    : formState.departmentLevel === 2
                      ? "e.g., Passenger Control"
                      : "e.g., Terminal 1 Departure"
                }
              />
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor={codeInputId}>Code *</Label>
              <Input
                id={codeInputId}
                value={formState.code}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder={
                  formState.departmentLevel === 1
                    ? "e.g., AVSEC"
                    : formState.departmentLevel === 2
                      ? "e.g., PAX-CTRL"
                      : "e.g., T1-DEP"
                }
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier code for this{" "}
                {getDepartmentLevelLabel(
                  formState.departmentLevel,
                ).toLowerCase()}
              </p>
            </div>

            {/* Parent (for Levels 2 & 3) */}
            {formState.departmentLevel > 1 && (
              <div className="space-y-2">
                <Label htmlFor={parentInputId}>
                  Parent{" "}
                  {formState.departmentLevel === 2 ? "Department" : "Unit"} *
                </Label>
                <Select
                  value={formState.parentDepartmentId || ""}
                  onValueChange={(val) =>
                    setFormState((s) => ({
                      ...s,
                      parentDepartmentId: val || null,
                    }))
                  }
                >
                  <SelectTrigger id={parentInputId}>
                    <SelectValue placeholder="Select parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <div className="flex items-center gap-2">
                          <DepartmentLevelIndicator level={opt.level} />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location Details (for Level 3 - Stations) */}
            {formState.departmentLevel === 3 && (
              <div className="space-y-2">
                <Label htmlFor={locationInputId}>Location Details</Label>
                <Input
                  id={locationInputId}
                  value={formState.locationDetails || ""}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      locationDetails: e.target.value || null,
                    }))
                  }
                  placeholder="e.g., Terminal 1, Departure Hall, Gate A1-A10"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor={descriptionInputId}>Description</Label>
              <Textarea
                id={descriptionInputId}
                value={formState.description || ""}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    description: e.target.value || null,
                  }))
                }
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            {/* Registry Toggle (primarily for Level 1) */}
            {formState.departmentLevel === 1 && (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <Label
                    htmlFor={registryInputId}
                    className="text-sm font-medium"
                  >
                    Mark as registry
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Registry departments manage official document intake.
                  </p>
                </div>
                <Switch
                  id={registryInputId}
                  checked={formState.isRegistry}
                  onCheckedChange={(checked) =>
                    setFormState((s) => ({ ...s, isRegistry: checked }))
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                !organizationId ||
                !formState.name.trim() ||
                !formState.code.trim() ||
                (formState.departmentLevel > 1 &&
                  !formState.parentDepartmentId) ||
                createMutation.isPending
              }
            >
              {createMutation.isPending
                ? "Saving..."
                : formState.isEditing
                  ? "Save Changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign HOD Dialog */}
      <Dialog open={assignHODDialog} onOpenChange={setAssignHODDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign{" "}
              {selectedDept?.departmentLevel === 2
                ? "Head of Unit"
                : "Head of Department"}
            </DialogTitle>
            <DialogDescription>
              Select a user to assign as{" "}
              {selectedDept?.departmentLevel === 2 ? "HOU" : "HOD"} for{" "}
              {selectedDept?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={hodSelectId}>Select User</Label>
            {/* Type-to-search: a plain list only ever held the first 100 people, so anyone further
                down (with 110+ staff imported) could not be chosen as a head. */}
            <ColleaguePicker
              id={hodSelectId}
              value={hodUserId || undefined}
              onChange={(id) => setHodUserId(id ?? "")}
              placeholder="Search by name..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignHODDialog(false);
                setHodUserId("");
                setSelectedDept(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignHOD}
              disabled={!hodUserId || assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Department"
        description={`Delete "${departmentToDelete?.name}" for good? This only works for a department nothing has used. If it has staff, documents or history, archive it instead.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Archive Confirmation */}
      <ConfirmDialog
        open={!!departmentToArchive}
        onOpenChange={(open) => {
          if (!open) setDepartmentToArchive(null);
        }}
        title="Archive Department"
        description={`Archive "${departmentToArchive?.name}"? It disappears from lists and pickers but its history is kept, and you can restore it later. It must have no active staff or open items.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
        loading={archiveMutation.isPending}
      />
    </div>
  );
}
