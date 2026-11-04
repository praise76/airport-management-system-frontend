import { requireStaff, ROLE_GROUPS } from "@/lib/access";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Users, ArrowRight, Save, Loader2 } from "lucide-react";

import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { listTemplates, generateRoster } from "@/api/roster";
import { useUsers } from "@/hooks/users";
import { useDepartmentTree } from "@/hooks/departments";
import { MemberPicker } from "@/features/roster/components/MemberPicker";
import { RosterPreviewGrid } from "@/features/roster/components/RosterPreviewGrid";
import { RosterConflictsPanel } from "@/features/roster/components/RosterConflicts";
import { RosterWarnings } from "@/features/roster/components/RosterWarnings";
import { checkRoster } from "@/features/roster/rosterChecks";
import type { RosterConflict } from "@/types/roster";
import { fullName, staffForUnit, type RosterPerson } from "@/features/roster/staffForUnit";

export const Route = createFileRoute("/roster/generate")({
  beforeLoad: requireStaff(ROLE_GROUPS.rosterPlanners),
  component: GenerateRosterPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      templateId: search.templateId as string | undefined,
    };
  },
});

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
  offsetDays: z.coerce.number().min(0),
});

const generateSchema = z.object({
  unitDepartmentId: z.string().min(1, "Unit is required"),
  templateId: z.string().min(1, "Template is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  teams: z.array(teamSchema).min(1, "Define at least one team"),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

function GenerateRosterPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [previewData, setPreviewData] = useState<any>(null);
  // Days the server will refuse (approved leave, already rostered elsewhere, twice in this run).
  const [conflicts, setConflicts] = useState<RosterConflict[]>([]);
  const conflictDays = new Set(conflicts.map((c) => `${c.staffId}|${c.dutyDate}`)).size;
  const [activeTab, setActiveTab] = useState("config");

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      unitDepartmentId: "",
      templateId: search.templateId || "",
      startDate: format(addDays(new Date(), 1), "yyyy-MM-dd"), // Tomorrow
      endDate: format(addDays(new Date(), 30), "yyyy-MM-dd"), // 30 days
      teams: [
        { name: "Team A", memberIds: [], offsetDays: 0 },
        { name: "Team B", memberIds: [], offsetDays: 2 }, // Example offset
      ],
    },
  });

  const selectedUnitId = form.watch("unitDepartmentId");

  // Fetch Data
  const { data: templates } = useQuery({
    queryKey: ["roster-templates"],
    queryFn: listTemplates,
  });
  const { data: usersData } = useUsers({
    limit: 500,
    departmentId: selectedUnitId || undefined,
  });

  // Only the selected unit's staff (filtered here too, in case the API ignores the filter).
  const unitStaff = useMemo(() => {
    if (!selectedUnitId) return { staff: [] as RosterPerson[], filtered: true };
    return staffForUnit((usersData?.data ?? []) as unknown as RosterPerson[], {
      unitId: selectedUnitId,
    });
  }, [usersData, selectedUnitId]);
  const users = unitStaff.staff as any[];
  const nameOf = (id: string) => fullName(users.find((u: any) => u.id === id)) || "Unknown";
  const { data: deptTree } = useDepartmentTree();

  // Extract units (departments level 2?) from tree - simplifying for now
  const units = useMemo(() => {
    if (!deptTree) return [];
    const collected: any[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.departmentLevel === 2) collected.push(node); // Assuming level 2 is Unit
        if (node.children) walk(node.children);
      });
    };
    walk(deptTree);
    return collected;
  }, [deptTree]);

  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({
    control: form.control,
    name: "teams",
  });

  // console.log("preview data", previewData);

  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === form.watch("templateId")),
    [templates, form.watch("templateId")],
  );

  const generateMutation = useMutation({
    mutationFn: generateRoster,
    onSuccess: (data, variables) => {
      if (variables.saveRoster) {
        toast.success(
          data.skipped
            ? `Roster saved. ${data.skipped} ${data.skipped === 1 ? "day was" : "days were"} left out because of leave or existing shifts.`
            : "Roster generated and saved successfully!",
        );
        navigate({ to: "/roster" }); // Redirect to main roster list
      } else {
        setPreviewData(data);
        setConflicts(data.conflicts ?? []);
        setActiveTab("preview");
        toast.success(
          data.conflicts?.length ? "Preview generated. Some days can't be rostered." : "Preview generated",
        );
      }
    },

    onError: (err: any) => {
      // A conflict can appear between the preview and the save (leave approved, another roster
      // saved). The server returns the full list, so refresh the panel instead of just a toast.
      const fresh = err?.status === 409 ? err?.details?.conflicts : undefined;
      if (Array.isArray(fresh)) {
        setConflicts(fresh);
        setActiveTab("preview");
      }
      toast.error(err?.message || "Couldn't generate the roster. Please try again.");
    },
  });

  const browserWarnings = checkRoster(previewData?.entries ?? [], { nameOf });

  const handleGenerate = (data: GenerateFormValues, save: boolean) => {
    generateMutation.mutate({
      ...data,
      saveRoster: save,
      // With conflicts the save leaves those days out; otherwise stay strict so a conflict that
      // appears after the preview still stops the save.
      conflictResolution: save && conflicts.length > 0 ? "skip" : "error",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate Roster</h1>
        <p className="text-muted-foreground">
          Auto-generate duty rosters from templates.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewData}>
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <form className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. General Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select Unit</Label>
                  <Select
                    onValueChange={(val) =>
                      form.setValue("unitDepartmentId", val)
                    }
                    value={form.watch("unitDepartmentId")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.length > 0 ? (
                        units.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.code})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="placeholder" disabled>
                          No units found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.unitDepartmentId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.unitDepartmentId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Select Template</Label>
                  <Select
                    onValueChange={(val) => form.setValue("templateId", val)}
                    value={form.watch("templateId")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.templateId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.templateId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" {...form.register("startDate")} />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" {...form.register("endDate")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Team Configuration</CardTitle>
                <CardDescription>
                  Assign staff to logical teams. Each team follows the rotation
                  cycle with a specific offset.
                  {selectedTemplate && (
                    <span className="block mt-1 font-mono text-xs text-muted-foreground">
                      Template Cycle:{" "}
                      {selectedTemplate.rotationCycle.join(" → ")}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {teamFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border p-4 rounded-lg bg-muted/20 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm">
                        Team #{index + 1}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeam(index)}
                        className="text-destructive"
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" /> Remove
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Team Name</Label>
                        <Input
                          {...form.register(`teams.${index}.name`)}
                          placeholder="Team Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rotation Offset (Days)</Label>
                        <Input
                          type="number"
                          {...form.register(`teams.${index}.offsetDays`)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          0 = Start at cycle day 1. 1 = Start at cycle day 2.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Team Members</Label>
                      <MemberPicker
                        people={users as RosterPerson[]}
                        selected={form.watch(`teams.${index}.memberIds`) ?? []}
                        onChange={(ids) =>
                          form.setValue(`teams.${index}.memberIds`, ids, {
                            shouldValidate: form.formState.isSubmitted,
                          })
                        }
                        takenBy={(() => {
                          const m = new Map<string, string>();
                          form.watch("teams").forEach((t, i) => {
                            if (i === index) return;
                            for (const id of t.memberIds ?? []) m.set(id, t.name || `Team ${i + 1}`);
                          });
                          return m;
                        })()}
                      />
                      {selectedUnitId && !unitStaff.filtered && (
                        <p className="text-xs text-muted-foreground">
                          Showing all staff: their records don't say which unit they belong to.
                        </p>
                      )}
                      {form.formState.errors.teams?.[index]?.memberIds && (
                        <p className="text-xs text-destructive">
                          {
                            form.formState.errors.teams[index]?.memberIds
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendTeam({
                      name: `Team ${String.fromCharCode(65 + teamFields.length)}`,
                      memberIds: [],
                      offsetDays: 0,
                    })
                  }
                >
                  <Users className="mr-2 h-4 w-4" /> Add Another Team
                </Button>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit((data) =>
                    handleGenerate(data, false),
                  )}
                >
                  {generateMutation.isPending &&
                  !generateMutation.variables?.saveRoster ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Generate Preview
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Roster Preview</CardTitle>
              <CardDescription>
                {previewData?.entries?.length ?? 0} shifts generated for{" "}
                {new Set((previewData?.entries ?? []).map((e: any) => e.staffId)).size} staff.
                Check the grid and any problems below before saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RosterConflictsPanel conflicts={conflicts} />
                {/* The all-clear banner only knows the browser-side checks; don't show it
                    under a red panel that says the server found problems. */}
                {(browserWarnings.length > 0 || conflicts.length === 0) && (
                  <RosterWarnings warnings={browserWarnings} />
                )}
                <RosterPreviewGrid
                  entries={previewData?.entries ?? []}
                  startDate={form.watch("startDate")}
                  endDate={form.watch("endDate")}
                  nameOf={nameOf}
                  conflicts={conflicts}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("config")}>
                Back to Config
              </Button>
              <Button
                onClick={form.handleSubmit((data) =>
                  handleGenerate(data, true),
                )}
              >
                {generateMutation.isPending &&
                generateMutation.variables?.saveRoster ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {conflictDays > 0
                  ? `Save and skip ${conflictDays} ${conflictDays === 1 ? "day" : "days"}`
                  : "Commit & Save Roster"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
