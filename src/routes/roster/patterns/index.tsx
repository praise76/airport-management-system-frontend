import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import {
	useCreateShiftPattern,
	useGetShiftPatterns,
} from "@/features/roster/api";
import type { ShiftPattern } from "@/features/roster/types";
import {
	PATTERN_PRESETS,
	PATTERN_SHIFT_OPTIONS,
	crewLabel,
	hoursPerWeek,
	planCrews,
} from "@/features/roster/patternPresets";
import { ROLE_GROUPS, requireStaff } from "@/lib/access";

export const Route = createFileRoute("/roster/patterns/")({
	beforeLoad: requireStaff(ROLE_GROUPS.rosterPlanners),
	component: ShiftPatternsPage,
});

function ShiftPatternsPage() {
	const { data: patterns, isLoading } = useGetShiftPatterns();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Shift Patterns</h1>
					<p className="text-muted-foreground">
						Define recurring shift patterns for your team.
					</p>
				</div>
				<CreatePatternDialog />
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<p>Loading patterns...</p>
				</div>
			) : patterns?.length === 0 ? (
				<div className="text-center py-12 border rounded-xl bg-muted/20">
					<Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
					<h3 className="mt-4 text-lg font-semibold">No patterns found</h3>
					<p className="mb-4 text-sm text-muted-foreground">
						Create your first shift pattern to get started.
					</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{patterns?.map((pattern) => (
						<PatternCard key={pattern.id} pattern={pattern} />
					))}
				</div>
			)}
		</div>
	);
}

function PatternCard({ pattern }: { pattern: ShiftPattern }) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start">
					<CardTitle className="text-lg font-medium">
						{pattern.patternName}
					</CardTitle>
					<Badge variant="outline">{pattern.patternType}</Badge>
				</div>
				<CardDescription>
					{pattern.cycleLengthDays}-day cycle · about {hoursPerWeek(pattern)} hours a week
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{[...(pattern.shiftSequenceJson ?? [])]
						.sort((a, b) => a.day - b.day)
						.map((seq) => (
							<Badge
								key={seq.day}
								variant="secondary"
								className="font-mono text-xs"
							>
								D{seq.day}: {PATTERN_SHIFT_OPTIONS.find((o) => o.value === seq.shift)?.label ?? seq.shift}
							</Badge>
						))}
				</div>
				<CrewPlanNote pattern={pattern} />
			</CardContent>
		</Card>
	);
}

function CreatePatternDialog() {
	const [open, setOpen] = useState(false);
	const createMutation = useCreateShiftPattern();

	const { register, control, handleSubmit, reset } = useForm<
		Omit<ShiftPattern, "id">
	>({
		defaultValues: {
			patternName: "",
			patternType: "rotating",
			cycleLengthDays: 7,
			shiftSequenceJson: [],
		},
	});

	const { fields, replace } = useFieldArray({
		control,
		name: "shiftSequenceJson",
	});

	// Auto-generate days when cycle length changes
	const handleCycleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const length = parseInt(e.target.value, 10) || 0;
		// Update fields to match length, preserving existing data if possible
		const currentFields = fields;
		const newFields = [];
		for (let i = 1; i <= length; i++) {
			const existing = currentFields.find((f) => f.day === i);
			newFields.push(
				existing ? { day: i, shift: existing.shift } : { day: i, shift: "off" },
			);
		}
		replace(newFields);
	};

	const onSubmit = async (data: Omit<ShiftPattern, "id">) => {
		try {
			await createMutation.mutateAsync({
				...data,
				cycleLengthDays: Number(data.cycleLengthDays),
			});
			toast.success("Shift pattern created");
			setOpen(false);
			reset();
		} catch {
			toast.error("Failed to create shift pattern");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" /> Create Pattern
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Shift Pattern</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-2">
						<Label>Start from a common pattern</Label>
						<div className="grid gap-2 sm:grid-cols-3">
							{PATTERN_PRESETS.map((p) => (
								<button
									key={p.key}
									type="button"
									onClick={() =>
										reset({
											patternName: p.patternName,
											patternType: p.patternType,
											cycleLengthDays: p.cycleLengthDays,
											shiftSequenceJson: p.shiftSequenceJson,
										})
									}
									className="rounded-md border p-3 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<span className="block font-medium">{p.patternName}</span>
									<span className="mt-1 block text-xs text-muted-foreground">{p.summary}</span>
									<span className="mt-1 block text-xs text-muted-foreground">{p.hours}</span>
								</button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Pattern Name</Label>
							<Input
								{...register("patternName")}
								required
								placeholder="e.g. 5 On 2 Off"
							/>
						</div>
						<div className="space-y-2">
							<Label>Type</Label>
							<Controller
								control={control}
								name="patternType"
								render={({ field }) => (
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="rotating">Rotating</SelectItem>
											<SelectItem value="permanent">Permanent</SelectItem>
											<SelectItem value="custom">Custom</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Cycle Length (Days)</Label>
						<Input
							type="number"
							{...register("cycleLengthDays", {
								onChange: handleCycleLengthChange,
								min: 1,
								max: 31,
							})}
						/>
					</div>

					<div className="space-y-2">
						<Label>Shift Sequence</Label>
						<div className="border rounded-md p-4 space-y-2 bg-muted/20">
							<div className="grid grid-cols-3 gap-4 mb-2 font-medium text-sm text-muted-foreground">
								<div className="col-span-1">Day</div>
								<div className="col-span-2">Shift</div>
							</div>
							{fields.map((field, index) => (
								<div
									key={field.id}
									className="grid grid-cols-3 gap-4 items-center"
								>
									<div className="col-span-1">
										<span className="text-sm font-medium">Day {field.day}</span>
										<input
											type="hidden"
											{...register(`shiftSequenceJson.${index}.day`)}
											value={field.day}
										/>
									</div>
									<div className="col-span-2">
										<Controller
											control={control}
											name={`shiftSequenceJson.${index}.shift`}
											render={({ field: selectField }) => (
												<Select
													onValueChange={selectField.onChange}
													value={selectField.value}
												>
													<SelectTrigger className="h-8">
														<SelectValue placeholder="Select shift" />
													</SelectTrigger>
													<SelectContent>
														{PATTERN_SHIFT_OPTIONS.map((o) => (
															<SelectItem key={o.value} value={o.value}>
																{o.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
									</div>
								</div>
							))}
							{fields.length === 0 && (
								<p className="text-center text-sm text-muted-foreground py-2">
									Set cycle length to generate days.
								</p>
							)}
						</div>
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={createMutation.isPending}
					>
						{createMutation.isPending ? "Creating..." : "Create Pattern"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/** How to stagger crews so every working shift is covered every day. */
function CrewPlanNote({ pattern }: { pattern: ShiftPattern }) {
	if (pattern.patternType === "permanent") {
		return (
			<p className="mt-3 text-xs text-muted-foreground">
				Fixed pattern: assign it from a Monday. It isn't meant to give 24-hour cover.
			</p>
		);
	}
	const plan = planCrews(pattern);
	if (!plan) {
		return (
			<p className="mt-3 text-xs text-muted-foreground">
				Staggered crews can't cover every shift every day with this pattern.
			</p>
		);
	}
	return (
		<p className="mt-3 text-xs text-muted-foreground">
			For 24-hour cover use {plan.crews} crews. Assign the pattern with start dates{" "}
			{plan.offsets
				.map((o, i) => `${crewLabel(i)}: ${o === 0 ? "day 0" : `+${o} days`}`)
				.join(", ")}
			.
		</p>
	);
}

// Helper for Controller
import { Controller } from "react-hook-form";
