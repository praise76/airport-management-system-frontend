import { hasAnyRole, requireStaff, ROLE_GROUPS } from "@/lib/access";
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
  useGetShiftPatterns,
  useGetShiftDefinitions,
} from "@/features/roster/api";
import { RosterGrid } from "@/features/roster/components/RosterGrid";
import { CreateRosterModal } from "@/features/roster/components/CreateRosterModal";
import { ManageEntryModal } from "@/features/roster/components/ManageEntryModal";
import { ShiftManager } from "@/features/roster/components/ShiftManager";
import { ShiftGrid } from "@/features/roster/components/ShiftGrid";
import { RotationCycleTable } from "@/features/roster/components/RotationCycleTable";
import { ManageShiftStaffModal } from "@/features/roster/components/ManageShiftStaffModal";
import { useUsers } from "@/hooks/users";

import { useAuthStore } from "@/stores/auth";
import { checkRoster } from "@/features/roster/rosterChecks";
import { RosterWarnings } from "@/features/roster/components/RosterWarnings";
import { staffForUnit, type RosterPerson } from "@/features/roster/staffForUnit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { eachDayOfInterval } from "date-fns";
import { StatusPill } from "@/components/ui/status-pill";
import { format, parseISO } from "date-fns";
import { RosterEntry } from "@/features/roster/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/roster/planner")({
  beforeLoad: requireStaff(ROLE_GROUPS.rosterPlanners),
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
  const [viewMode, setViewMode] = useState<"staff" | "shift" | "rotation">(
    "shift",
  );

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
  const { data: shiftPatterns, isError: patternsFailed, isLoading: patternsLoading } = useGetShiftPatterns();

  // Staff for the selected roster's unit (filtered again below, in case the API ignores the filter).
  const { data: usersData } = useUsers({
    limit: 500,
    departmentId: selectedRoster?.unitDepartmentId || undefined,
  });
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const approveMutation = useApproveRoster();
  const deleteMutation = useDeleteRoster();

  const user = useAuthStore((s) => s.user);
  const canCreateRoster = hasAnyRole(user, ROLE_GROUPS.rosterPlanners);

  const rosterStaff = useMemo(() => {
    const fromEntries = (selectedRoster?.entries ?? [])
      .map((e: any) => (e.user ? { ...e.user, id: e.user.id ?? e.staffId } : null))
      .filter(Boolean) as RosterPerson[];
    return staffForUnit((usersData?.data ?? []) as unknown as RosterPerson[], {
      unitId: selectedRoster?.unitDepartmentId,
      departmentId: selectedRoster?.departmentId,
      alreadyRostered: fromEntries,
    });
  }, [usersData, selectedRoster]);

  const rosterDates = useMemo(() => {
    if (!selectedRoster?.startDate || !selectedRoster?.endDate) return [];
    try {
      return eachDayOfInterval({
        start: parseISO(selectedRoster.startDate),
        end: parseISO(selectedRoster.endDate),
      }).map((d) => format(d, "yyyy-MM-dd"));
    } catch {
      return [];
    }
  }, [selectedRoster?.startDate, selectedRoster?.endDate]);

  const warnings = useMemo(() => {
    if (!selectedRoster) return [];
    const names = new Map(
      rosterStaff.staff.map((u) => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()]),
    );
    return checkRoster(selectedRoster.entries ?? [], {
      nameOf: (id) => names.get(id) || "A staff member",
      requiredShifts: (shiftDefinitions ?? []).map((d) => ({ id: d.id, name: d.name })),
      dates: rosterDates,
    });
  }, [selectedRoster, rosterStaff, shiftDefinitions, rosterDates]);

  const prettyRange = (start?: string, end?: string) => {
    try {
      if (!start || !end) return "";
      return `${format(parseISO(start), "d MMM")} – ${format(parseISO(end), "d MMM yyyy")}`;
    } catch {
      return `${start ?? ""} – ${end ?? ""}`;
    }
  };

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
    shiftType?: string,
  ) => {
    const effectiveShift = shiftDef || {
      id: shiftType || "custom",
      name: shiftType
        ? shiftType.charAt(0).toUpperCase() + shiftType.slice(1)
        : "Shift",
      startTime: "00:00",
      endTime: "00:00",
    };

    setSelectedShiftForModal(effectiveShift);
    setSelectedDateForEntry(date);
    setSelectedEntriesForModal(entries);
    setIsShiftStaffModalOpen(true);
  };

  const publish = () => {
    if (!selectedRosterId) return;
    approveMutation.mutate(selectedRosterId, {
      onSuccess: () => {
        setPublishConfirmOpen(false);
        toast.success("Roster published");
      },
      onError: (err: any) =>
        toast.error(err?.message || "Couldn't publish the roster. Please try again."),
    });
  };

  // With problems found, ask first; otherwise publish straight away.
  const handleApprove = () => {
    if (warnings.length > 0) setPublishConfirmOpen(true);
    else publish();
  };

  const handleDeleteRoster = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Roster deleted");
        setDeleteTarget(null);
        if (selectedRosterId === id) setSelectedRosterId(null);
      },
      onError: (err: any) => toast.error(err?.message || "Couldn't delete the roster."),
    });
  };

  const deleteDialog = (
    <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this draft roster?</DialogTitle>
          <DialogDescription>
            All shifts in it will be removed. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete roster"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (selectedRosterId && selectedRoster) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedRosterId(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-foreground break-words">
                {selectedRoster.rosterName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {prettyRange(selectedRoster?.startDate, selectedRoster?.endDate)}
                </span>
                <StatusPill status={selectedRoster?.approvalStatus} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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

        {selectedRoster.approvalStatus === "draft" && <RosterWarnings warnings={warnings} />}

        <div className="flex-1 min-h-0 overflow-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
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
                <TabsTrigger value="rotation" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Rotation Pattern
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground italic">
              {viewMode === "shift"
                ? "Manage multiple staff per shift"
                : viewMode === "staff"
                  ? "Assign shifts to individual staff members"
                  : "View and manage standard 8-day rotation cycles"}
            </p>
          </div>

          {viewMode === "staff" && !rosterStaff.filtered && (
            <p className="text-xs text-muted-foreground px-1">
              Showing all staff: their records don't say which unit they belong to.
            </p>
          )}
          {rosterLoading ? (
            <p>Loading details...</p>
          ) : viewMode === "staff" ? (
            <RosterGrid
              roster={selectedRoster}
              users={rosterStaff.staff}
              onCellClick={handleCellClick}
            />
          ) : viewMode === "shift" ? (
            <ShiftGrid
              roster={selectedRoster}
              shifts={shiftDefinitions || []}
              onCellClick={handleShiftCellClick}
            />
          ) : (
            <RotationCycleTable
              patterns={
                shiftPatterns && shiftPatterns.length > 0
                  ? shiftPatterns.map((p) => ({
                      name: p.patternName,
                      pattern: p.shiftSequenceJson
                        .sort((a, b) => a.day - b.day)
                        .map((s) => s.shift),
                    }))
                  : undefined
              }
              cycleLength={shiftPatterns?.[0]?.cycleLengthDays || 8}
              loadFailed={patternsFailed}
              loading={patternsLoading}
              shifts={shiftDefinitions || []}
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

        <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish with {warnings.length} problems?</DialogTitle>
              <DialogDescription>
                Staff will see this roster once it's published. You can fix these first, or
                publish anyway if they're intended.
              </DialogDescription>
            </DialogHeader>
            <RosterWarnings warnings={warnings} className="max-h-72 overflow-auto" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPublishConfirmOpen(false)}>
                Go back and fix
              </Button>
              <Button onClick={publish} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? "Publishing…" : "Publish anyway"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {deleteDialog}

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
      <div className="flex flex-wrap items-center justify-between gap-4">
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
                {prettyRange(roster?.startDate, roster?.endDate)}
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

      {deleteDialog}
      <CreateRosterModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
