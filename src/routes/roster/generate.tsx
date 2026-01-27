import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Users,
  ArrowRight,
  Check,
  Save,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { listTemplates, generateRoster } from "@/api/roster";
import { useUsers } from "@/hooks/users";
import { useDepartmentTree } from "@/hooks/departments";

export const Route = createFileRoute("/roster/generate")({
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
  unitId: z.string().min(1, "Unit is required"),
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
  const [activeTab, setActiveTab] = useState("config");

  // Fetch Data
  const { data: templates } = useQuery({
    queryKey: ["roster-templates"],
    queryFn: listTemplates,
  });
  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data || [];
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

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      unitId: "",
      templateId: search.templateId || "",
      startDate: format(addDays(new Date(), 1), "yyyy-MM-dd"), // Tomorrow
      endDate: format(addDays(new Date(), 30), "yyyy-MM-dd"), // 30 days
      teams: [
        { name: "Team A", memberIds: [], offsetDays: 0 },
        { name: "Team B", memberIds: [], offsetDays: 2 }, // Example offset
      ],
    },
  });

  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({
    control: form.control,
    name: "teams",
  });

  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === form.watch("templateId")),
    [templates, form.watch("templateId")],
  );

  const generateMutation = useMutation({
    mutationFn: generateRoster,
    onSuccess: (data, variables) => {
      if (variables.saveRoster) {
        toast.success("Roster generated and saved successfully!");
        navigate({ to: "/roster" }); // Redirect to main roster list
      } else {
        setPreviewData(data);
        setActiveTab("preview");
        toast.success("Preview generated");
      }
    },
    onError: () => toast.error("Failed to generate roster"),
  });

  const handleGenerate = (data: GenerateFormValues, save: boolean) => {
    generateMutation.mutate({
      ...data,
      saveRoster: save,
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
                    onValueChange={(val) => form.setValue("unitId", val)}
                    value={form.watch("unitId")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.length > 0 ? (
                        units.map((u) => (
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
                  {form.formState.errors.unitId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.unitId.message}
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
                      {/* Simple multi-select using native select for simplicity, or we could build a fancier one */}
                      <Select
                        onValueChange={(val) => {
                          const current = form.getValues(
                            `teams.${index}.memberIds`,
                          );
                          if (!current.includes(val)) {
                            form.setValue(`teams.${index}.memberIds`, [
                              ...current,
                              val,
                            ]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {form
                          .watch(`teams.${index}.memberIds`)
                          ?.map((userId) => {
                            const user = users.find((u) => u.id === userId);
                            return (
                              <Badge
                                key={userId}
                                variant="secondary"
                                className="pr-1"
                              >
                                {user?.firstName} {user?.lastName}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => {
                                    const current = form.getValues(
                                      `teams.${index}.memberIds`,
                                    );
                                    form.setValue(
                                      `teams.${index}.memberIds`,
                                      current.filter((id) => id !== userId),
                                    );
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                      </div>
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
                Generated {previewData?.entries.length} entries. Review the
                schedule below before saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple Table Preview */}
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium">
                      <tr>
                        <th className="p-3 sticky top-0 bg-muted">Date</th>
                        <th className="p-3 sticky top-0 bg-muted">Staff</th>
                        <th className="p-3 sticky top-0 bg-muted">Shift</th>
                        <th className="p-3 sticky top-0 bg-muted">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewData?.entries.map((entry: any, i: number) => {
                        const user = users.find((u) => u.id === entry.staffId);
                        return (
                          <tr key={i} className="hover:bg-muted/10">
                            <td className="p-3">
                              {format(new Date(entry.dutyDate), "EEE, MMM d")}
                            </td>
                            <td className="p-3 font-medium">
                              {user
                                ? `${user.firstName} ${user.lastName}`
                                : entry.staffId}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{entry.shift}</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {entry.shiftStartTime} - {entry.shiftEndTime}
                            </td>
                          </tr>
                        );
                      })}
                      {(!previewData || previewData.entries.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No entries generated. Check your dates and
                            configuration.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                Commit & Save Roster
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
