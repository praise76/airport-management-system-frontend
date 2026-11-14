import {
  Archive,
  ArchiveRestore,
  Edit2,
  FolderPlus,
  MapPinPlus,
  Trash2,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DepartmentTreeNode } from "@/types/department";

type Props = {
  node: DepartmentTreeNode;
  restoring?: boolean;
  onAddUnit: () => void;
  onAddStation: () => void;
  onEdit: () => void;
  onAssignHead: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
};

/**
 * The buttons on one row of the department tree. An archived department can only be restored:
 * it is history now, so it is not edited, given a head, or filled with units.
 */
export function DepartmentRowActions({
  node,
  restoring,
  onAddUnit,
  onAddStation,
  onEdit,
  onAssignHead,
  onArchive,
  onDelete,
  onRestore,
}: Props) {
  const head = node.departmentLevel === 2 ? "HOU" : "HOD";
  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
      {node.archivedAt ? (
        <Button type="button" size="sm" variant="ghost" disabled={restoring} onClick={onRestore} title="Restore">
          <ArchiveRestore className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Restore</span>
        </Button>
      ) : (
        <>
          {node.departmentLevel === 1 && (
            <Button type="button" size="sm" variant="ghost" onClick={onAddUnit} title="Add Unit">
              <FolderPlus className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Unit</span>
            </Button>
          )}
          {node.departmentLevel === 2 && (
            <Button type="button" size="sm" variant="ghost" onClick={onAddStation} title="Add Station">
              <MapPinPlus className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Station</span>
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={onEdit} title="Edit">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onAssignHead}
            title={node.hod ? `Change ${head}` : `Assign ${head}`}
          >
            <UserCog className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onArchive} title="Archive (hide it but keep its history)">
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
