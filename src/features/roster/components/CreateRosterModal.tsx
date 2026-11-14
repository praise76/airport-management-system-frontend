import { useCallback, useState } from "react";
import { api } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { updateCrewMeta, listCrews } from "../crews";
import type { planShifts, TeamPlan } from "../buildRoster";
import { PatternTeamsStep, type PatternTeamsValue } from "./PatternTeamsStep";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRoster } from "../api";
import {
  useDepartments,
  useDepartmentUnits,
  useUnitStations,
} from "@/hooks/departments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateRosterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRosterModal({
  open,
  onOpenChange,
}: CreateRosterModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [stationId, setStationId] = useState("");

  const { data: departments, isLoading: departmentsLoading } = useDepartments({
    limit: 100,
  });
  const { data: units, isLoading: unitsLoading } =
    useDepartmentUnits(departmentId);
  const { data: stations, isLoading: stationsLoading } =
    useUnitStations(unitId);

  // console.log("units", units);

  const { mutateAsync, isPending } = useCreateRoster();
  const qc = useQueryClient();
  const [patternTeams, setPatternTeams] = useState<PatternTeamsValue>({ patternId: "", starts: {} });
  const [plan, setPlan] = useState<{ teams: (TeamPlan & { id: string })[]; shifts: ReturnType<typeof planShifts> }>({ teams: [], shifts: [] });
  const onPlan = useCallback((p: typeof plan) => setPlan(p), []);
  const [progress, setProgress] = useState<string | null>(null);
  const teamUnit = stationId || unitId || departmentId;

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setUnitId(""); // Reset unit when department changes
    setStationId("");
  };

  const handleUnitChange = (value: string) => {
    setUnitId(value);
    setStationId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // QA finding RST-01: a roster from 21 Nov to 8 Nov was accepted.
    if (startDate && endDate && endDate < startDate) {
      toast.error("The end date must be on or after the start date.");
      return;
    }
    void (async () => {
      let roster: any;
      try {
        roster = await mutateAsync({
          rosterName: name,
          startDate,
          endDate,
          unitDepartmentId: stationId || unitId || undefined,
          departmentId: departmentId || undefined,
          approvalStatus: "draft" as any,
        });
      } catch (err: any) {
        toast.error(err?.message || "Failed to create roster");
        return;
      }
      let made = 0;
      const failed: string[] = [];
      if (patternTeams.patternId && plan.shifts.length && roster?.id) {
        // Remember each team's pattern and day 1, so Patterns & teams and later rosters agree.
        const teams = await listCrews(teamUnit).catch(() => []);
        for (const t of plan.teams) {
          const team = teams.find((x) => x.id === t.id);
          if (team && (team.meta.patternId !== patternTeams.patternId || team.meta.startDate !== t.startDate))
            await updateCrewMeta(team, { ...team.meta, patternId: patternTeams.patternId, startDate: t.startDate }).catch(() => {});
        }
        const queue = [...plan.shifts];
        const worker = async () => {
          for (let s = queue.shift(); s; s = queue.shift()) {
            try {
              await api.post(`/roster/${roster.id}/entries`, { ...s, rosterId: roster.id, status: "scheduled" });
              made++;
            } catch (err: any) {
              failed.push(err?.message || "refused");
            }
            setProgress(`Adding shifts: ${made + failed.length} of ${plan.shifts.length}`);
          }
        };
        await Promise.all([worker(), worker(), worker(), worker()]);
        qc.invalidateQueries({ queryKey: ["roster", roster.id] });
      }
      setProgress(null);
      if (failed.length)
        toast.warning(`Roster created with ${made} of ${plan.shifts.length} shifts. ${failed.length} were refused, for example: ${failed[0]}`);
      else toast.success(made ? `Roster created with ${made} shifts` : "Roster created");
      onOpenChange(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setDepartmentId("");
      setUnitId("");
      setStationId("");
      setPatternTeams({ patternId: "", starts: {} });
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Roster</DialogTitle>
          <DialogDescription>
            Set the period and unit, then choose the shift pattern and the teams that work it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Roster Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jan 2024 - Team A"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date</Label>
              <Input
                id="end"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    departmentsLoading ? "Loading..." : "Select Department"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {departments?.data
                  ?.filter((d) => d.departmentLevel === 1)
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
              value={unitId}
              onValueChange={handleUnitChange}
              disabled={!departmentId || unitsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !departmentId
                      ? "Select a department first"
                      : unitsLoading
                        ? "Loading units..."
                        : "Select Unit"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {units?.data?.map((unit: any) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Station (Optional)</Label>
            <Select
              value={stationId}
              onValueChange={setStationId}
              disabled={!unitId || stationsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !unitId
                      ? "Select a unit first"
                      : stationsLoading
                        ? "Loading stations..."
                        : "Select Station"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {stations?.data?.map((station: any) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PatternTeamsStep
            unitId={teamUnit}
            from={startDate}
            to={endDate}
            value={patternTeams}
            onChange={setPatternTeams}
            onPlan={onPlan}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !!progress}>
              {(isPending || progress) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {progress ?? (plan.shifts.length ? `Create roster with ${plan.shifts.length} shifts` : "Create Roster")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
