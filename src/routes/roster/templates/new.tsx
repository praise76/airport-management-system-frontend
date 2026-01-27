import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowLeft, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { createTemplate } from "@/api/roster";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/roster/templates/new")({
  component: CreateTemplatePage,
});

const shiftDefinitionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  duration: z.coerce.number().min(0, "Duration must be positive"),
  color: z.string().min(1, "Color is required"),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  minStaffPerShift: z.coerce.number().min(1, "Min staff must be at least 1"),
  idealTeamSize: z.coerce.number().min(1, "Ideal team size must be at least 1"),
  shiftDefinitions: z
    .array(shiftDefinitionSchema)
    .min(1, "At least one shift definition is required"),
  rotationCycle: z.array(z.string()).min(1, "Rotation cycle cannot be empty"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const DEFAULT_SHIFTS = [
  {
    name: "Morning",
    startTime: "06:00",
    endTime: "14:00",
    duration: 8,
    color: "#FFD700",
  },
  {
    name: "Afternoon",
    startTime: "14:00",
    endTime: "22:00",
    duration: 8,
    color: "#FFA500",
  },
  {
    name: "Night",
    startTime: "22:00",
    endTime: "06:00",
    duration: 8,
    color: "#4169E1",
  },
  {
    name: "OFF",
    startTime: "00:00",
    endTime: "00:00",
    duration: 0,
    color: "#808080",
  },
];

function CreateTemplatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      type: "weekly",
      minStaffPerShift: 2,
      idealTeamSize: 4,
      shiftDefinitions: DEFAULT_SHIFTS,
      rotationCycle: [],
    },
  });

  const {
    fields: shiftFields,
    append: appendShift,
    remove: removeShift,
  } = useFieldArray({
    control: form.control,
    name: "shiftDefinitions",
  });

  const [rotationCycle, setRotationCycle] = useState<string[]>([]);

  // Sync state with form manually for rotation cycle since it's a simple array of strings
  const addToCycle = (shiftName: string) => {
    const newCycle = [...rotationCycle, shiftName];
    setRotationCycle(newCycle);
    form.setValue("rotationCycle", newCycle);
  };

  const removeFromCycle = (index: number) => {
    const newCycle = rotationCycle.filter((_, i) => i !== index);
    setRotationCycle(newCycle);
    form.setValue("rotationCycle", newCycle);
  };

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["roster-templates"] });
      navigate({ to: "/roster/templates" });
    },
    onError: (error) => {
      toast.error("Failed to create template");
      console.error(error);
    },
  });

  const onSubmit = (data: TemplateFormValues) => {
    // Transform array of definitions to Record<string, ShiftDefinition>
    const shiftDefinitionsRecord: Record<string, any> = {};
    data.shiftDefinitions.forEach((shift) => {
      shiftDefinitionsRecord[shift.name] = shift;
    });

    createMutation.mutate({
      name: data.name,
      type: data.type,
      minStaffPerShift: data.minStaffPerShift,
      idealTeamSize: data.idealTeamSize,
      shiftDefinitions: shiftDefinitionsRecord,
      rotationCycle: data.rotationCycle,
    });
  };

  const watchedShifts = form.watch("shiftDefinitions");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/roster/templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create Roster Template
          </h1>
          <p className="text-muted-foreground">
            Define shift patterns and rotation cycles.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Basic information about this rotation template.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Standard 4-Shift Rotation"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Pattern Type</Label>
              <Select
                onValueChange={(val) => form.setValue("type", val)}
                defaultValue={form.getValues("type")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Rotation</SelectItem>
                  <SelectItem value="four_shift">4-Shift Pattern</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStaff">Min Staff Per Shift</Label>
              <Input
                id="minStaff"
                type="number"
                {...form.register("minStaffPerShift")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Ideal Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                {...form.register("idealTeamSize")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shift Definitions */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Definitions</CardTitle>
            <CardDescription>
              Define the shifts available for this rotation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shiftFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-md bg-muted/20"
              >
                <div className="md:col-span-3 space-y-2">
                  <Label>Name</Label>
                  <Input
                    {...form.register(`shiftDefinitions.${index}.name`)}
                    placeholder="Shift Name"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    {...form.register(`shiftDefinitions.${index}.startTime`)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>End</Label>
                  <Input
                    type="time"
                    {...form.register(`shiftDefinitions.${index}.endTime`)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    {...form.register(`shiftDefinitions.${index}.duration`)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1"
                      {...form.register(`shiftDefinitions.${index}.color`)}
                    />
                    <Input
                      {...form.register(`shiftDefinitions.${index}.color`)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeShift(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendShift({
                  name: "New Shift",
                  startTime: "08:00",
                  endTime: "16:00",
                  duration: 8,
                  color: "#000000",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add Shift Definition
            </Button>
          </CardContent>
        </Card>

        {/* Rotation Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Rotation Cycle Builder</CardTitle>
            <CardDescription>
              Click shifts below to add them to the cycle. Click items in the
              cycle to remove them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Available Shifts (Click to Add)</Label>
              <div className="flex gap-2 flex-wrap">
                {watchedShifts.map((shift) => (
                  <Button
                    key={shift.name} // Assuming names are unique for simplicity here
                    type="button"
                    variant="outline"
                    className="border-2 hover:bg-muted"
                    style={{ borderColor: shift.color }}
                    onClick={() => addToCycle(shift.name)}
                  >
                    <Plus
                      className="mr-2 h-4 w-4"
                      style={{ color: shift.color }}
                    />
                    {shift.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>
                  Current Rotation Cycle ({rotationCycle.length} days)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRotationCycle([]);
                    form.setValue("rotationCycle", []);
                  }}
                  className="text-muted-foreground text-xs"
                >
                  Clear All
                </Button>
              </div>

              <div className="min-h-[100px] border-2 border-dashed rounded-lg p-4 flex flex-wrap gap-2 items-center bg-muted/10">
                {rotationCycle.length === 0 ? (
                  <div className="w-full text-center text-muted-foreground text-sm">
                    No shifts added to cycle yet.
                  </div>
                ) : (
                  rotationCycle.map((shiftName, index) => {
                    const shiftDef = watchedShifts.find(
                      (s) => s.name === shiftName,
                    );
                    return (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => removeFromCycle(index)}
                      >
                        <Badge
                          className="h-10 px-4 text-sm border-2"
                          variant="outline"
                          style={{
                            borderColor: shiftDef?.color || "#ccc",
                            backgroundColor: (shiftDef?.color || "#ccc") + "20",
                          }}
                        >
                          <span className="font-bold mr-2 text-muted-foreground">
                            {index + 1}.
                          </span>
                          {shiftName}
                        </Badge>
                        <div className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 bg-destructive text-white rounded-full items-center justify-center text-xs">
                          ×
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {form.formState.errors.rotationCycle && (
              <p className="text-sm text-destructive">
                {form.formState.errors.rotationCycle.message}
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" size="lg" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Create Template"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
