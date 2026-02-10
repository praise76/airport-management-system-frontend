import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowLeft,
  CheckCircle,
  Trash2,
  Users,
  CalendarDays,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMemo } from "react";
import {
  useGetRosters,
  useGetRoster,
  useApproveRoster,
  useDeleteRoster,
} from "@/features/roster/api";
import { RosterGrid } from "@/features/roster/components/RosterGrid";
import { CreateRosterModal } from "@/features/roster/components/CreateRosterModal";
import { ManageEntryModal } from "@/features/roster/components/ManageEntryModal";
import { ShiftManager } from "@/features/roster/components/ShiftManager";
import { ShiftGrid } from "@/features/roster/components/ShiftGrid";
import { ManageShiftStaffModal } from "@/features/roster/components/ManageShiftStaffModal";
import { useGetShiftDefinitions } from "@/features/roster/api";
import { useUsers } from "@/hooks/users";

import { useAuthStore } from "@/stores/auth";
import { StatusPill } from "@/components/ui/status-pill";
import { format, parseISO } from "date-fns";
import { RosterEntry } from "@/features/roster/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/roster/planner")({
  component: RosterPlannerPage,
});

function RosterPlannerPage() {
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Entry Management State
  const [editingEntry, setEditingEntry] = useState<RosterEntry | undefined>(
    undefined,
  );
  const [selectedUserForEntry, setSelectedUserForEntry] = useState<string>("");
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<Date | null>(
    null,
  );
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"staff" | "shift">("shift");

  // Shift Management State
  const [isShiftStaffModalOpen, setIsShiftStaffModalOpen] = useState(false);
  const [selectedShiftForModal, setSelectedShiftForModal] = useState<any>(null);
  const [selectedEntriesForModal, setSelectedEntriesForModal] = useState<any[]>(
    [],
  );

  const { data: rosters, isLoading: rostersLoading } = useGetRosters();
  const { data: selectedRoster, isLoading: rosterLoading } = useGetRoster(
    selectedRosterId || "",
  );
  const { data: shiftDefinitions } = useGetShiftDefinitions({
    unitDepartmentId: selectedRoster?.unitDepartmentId,
  });

  const { data: usersData } = useUsers({ limit: 100 });

  const approveMutation = useApproveRoster();
  const deleteMutation = useDeleteRoster();

  const user = useAuthStore((s) => s.user);
  const canCreateRoster = useMemo(() => {
    if (!user?.role) return false;
    const role = user.role.toUpperCase();
    return ["SUPER_ADMIN", "ORG_ADMIN", "ADMIN", "HOD", "HOU"].includes(role);
  }, [user?.role]);

  const handleCellClick = (userId: string, date: Date, entry?: RosterEntry) => {
    setSelectedUserForEntry(userId);
    setSelectedDateForEntry(date);
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleShiftCellClick = (
    shiftDef: any,
    date: Date,
    entries: RosterEntry[],
  ) => {
    setSelectedShiftForModal(shiftDef);
    setSelectedDateForEntry(date);
    setSelectedEntriesForModal(entries);
    setIsShiftStaffModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedRosterId) return;
    approveMutation.mutate(selectedRosterId, {
      onSuccess: () => toast.success("Roster published successfully"),
    });
  };

  const handleDeleteRoster = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this roster?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Roster deleted");
          if (selectedRosterId === id) setSelectedRosterId(null);
        },
      });
    }
  };

  if (selectedRosterId && selectedRoster) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedRosterId(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white">
                {selectedRoster.rosterName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {selectedRoster?.startDate || ""} -{" "}
                  {selectedRoster?.endDate || ""}
                </span>
                <StatusPill status={selectedRoster?.approvalStatus} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <ShiftManager unitDepartmentId={selectedRoster.unitDepartmentId} />

            {selectedRoster.approvalStatus === "draft" && (
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Publish Roster
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto space-y-4">
          <div className="flex items-center justify-between px-1">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as any)}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="shift" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Shift View
                </TabsTrigger>
                <TabsTrigger value="staff" className="gap-2">
                  <Users className="h-4 w-4" />
                  Staff View
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground italic">
              {viewMode === "shift"
                ? "Manage multiple staff per shift"
                : "Assign shifts to individual staff members"}
            </p>
          </div>

          {rosterLoading ? (
            <p>Loading details...</p>
          ) : viewMode === "staff" ? (
            <RosterGrid
              roster={selectedRoster}
              users={usersData?.data || []}
              onCellClick={handleCellClick}
            />
          ) : (
            <ShiftGrid
              roster={selectedRoster}
              shifts={shiftDefinitions || []}
              onCellClick={handleShiftCellClick}
            />
          )}
        </div>

        {isEntryModalOpen && selectedDateForEntry && (
          <ManageEntryModal
            open={isEntryModalOpen}
            onOpenChange={setIsEntryModalOpen}
            rosterId={selectedRosterId}
            userId={selectedUserForEntry}
            date={selectedDateForEntry}
            existingEntry={editingEntry}
            unitDepartmentId={selectedRoster.unitDepartmentId}
          />
        )}

        {isShiftStaffModalOpen &&
          selectedDateForEntry &&
          selectedShiftForModal && (
            <ManageShiftStaffModal
              open={isShiftStaffModalOpen}
              onOpenChange={setIsShiftStaffModalOpen}
              rosterId={selectedRosterId}
              shift={selectedShiftForModal}
              date={selectedDateForEntry}
              entries={selectedEntriesForModal}
              unitDepartmentId={selectedRoster.unitDepartmentId}
            />
          )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roster Planner</h1>
          <p className="text-muted-foreground">
            Manage duty rosters and shift assignments
          </p>
        </div>
        {canCreateRoster && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Roster
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rostersLoading && <p>Loading rosters...</p>}
        {(Array.isArray(rosters) ? rosters : (rosters as any)?.data || []).map(
          (roster: any) => (
            <div
              key={roster.id}
              className="border p-4 rounded-xl hover:border-primary/50 cursor-pointer transition-colors bg-card"
              onClick={() => setSelectedRosterId(roster.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{roster.rosterName}</h3>
                <StatusPill status={roster.approvalStatus} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {format(roster?.startDate, "MMM d")} -{" "}
                {format(roster?.endDate, "MMM d, yyyy")}
              </p>
              <div className="flex justify-between items-center text-sm">
                <div className="text-muted-foreground">
                  {/* Placeholder for stats */}
                  Select to view details
                </div>
                {roster.approvalStatus === "draft" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteRoster(e, roster.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ),
        )}
        {!rostersLoading &&
          (Array.isArray(rosters) ? rosters : (rosters as any)?.data || [])
            .length === 0 && (
            <div className="col-span-full text-center py-10 border border-dashed rounded-xl">
              <p className="text-muted-foreground">
                No rosters found. Create one to get started.
              </p>
            </div>
          )}
      </div>

      <CreateRosterModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
