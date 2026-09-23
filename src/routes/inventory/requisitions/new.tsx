import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateRequisition,
	useInventoryLocations,
	useItems,
	useSubmitRequisition,
} from "@/hooks/inventory";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/inventory/requisitions/new")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: NewRequisitionPage,
});

type LineItemDraft = {
	key: string;
	itemId: string;
	quantityRequested: number;
	notes: string;
};

let lineKeySeq = 0;
const newLineDraft = (): LineItemDraft => ({
	key: `line-${++lineKeySeq}`,
	itemId: "",
	quantityRequested: 1,
	notes: "",
});

function NewRequisitionPage() {
	const navigate = useNavigate();
	const [locationId, setLocationId] = useState("");
	const [justification, setJustification] = useState("");
	const [lines, setLines] = useState<LineItemDraft[]>([newLineDraft()]);
	const [submitImmediately, setSubmitImmediately] = useState(true);

	const { data: locations } = useInventoryLocations();
	const { data: items } = useItems({ isActive: true });
	const createRequisition = useCreateRequisition();
	const submitRequisition = useSubmitRequisition();

	function updateLine(key: string, patch: Partial<LineItemDraft>) {
		setLines((prev) =>
			prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
		);
	}

	function addLine() {
		setLines((prev) => [...prev, newLineDraft()]);
	}

	function removeLine(key: string) {
		setLines((prev) => prev.filter((l) => l.key !== key));
	}

	const isValid =
		!!locationId &&
		lines.length > 0 &&
		lines.every((l) => l.itemId && l.quantityRequested > 0);

	async function handleSubmit() {
		if (!isValid) return;
		const requisition = await createRequisition.mutateAsync({
			locationId,
			justification: justification || undefined,
			lineItems: lines.map((l) => ({
				itemId: l.itemId,
				quantityRequested: l.quantityRequested,
				notes: l.notes || undefined,
			})),
		});
		if (submitImmediately) {
			await submitRequisition.mutateAsync(requisition.id);
		}
		navigate({
			to: "/inventory/requisitions/$requisitionId",
			params: { requisitionId: requisition.id },
		});
	}

	return (
		<div className="p-6 max-w-3xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">New Requisition</h1>
				<p className="text-sm text-muted-foreground">
					Request items from a store. Approval routes automatically based on the
					total value.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Issuing Location</Label>
						<Select value={locationId} onValueChange={setLocationId}>
							<SelectTrigger>
								<SelectValue placeholder="Select the store to issue from" />
							</SelectTrigger>
							<SelectContent>
								{locations?.map((l) => (
									<SelectItem key={l.id} value={l.id}>
										{l.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="justification">Justification</Label>
						<Textarea
							id="justification"
							value={justification}
							onChange={(e) => setJustification(e.target.value)}
							placeholder="Why are these items needed?"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">Line Items</CardTitle>
					<Button variant="outline" size="sm" onClick={addLine}>
						<Plus className="size-4 mr-1" /> Add Line
					</Button>
				</CardHeader>
				<CardContent className="space-y-3">
					{lines.map((line) => (
						<div
							key={line.key}
							className="flex items-end gap-2 border-b pb-3 last:border-b-0"
						>
							<div className="flex-1 space-y-2">
								<Label>Item</Label>
								<Select
									value={line.itemId}
									onValueChange={(v) => updateLine(line.key, { itemId: v })}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select item" />
									</SelectTrigger>
									<SelectContent>
										{items?.map((i) => (
											<SelectItem key={i.id} value={i.id}>
												{i.name} ({i.sku})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="w-28 space-y-2">
								<Label>Quantity</Label>
								<Input
									type="number"
									min={1}
									value={line.quantityRequested}
									onChange={(e) =>
										updateLine(line.key, {
											quantityRequested: Number(e.target.value),
										})
									}
								/>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeLine(line.key)}
								disabled={lines.length === 1}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="flex items-center justify-end gap-3">
				<Button
					variant="outline"
					onClick={() => navigate({ to: "/inventory/requisitions" })}
				>
					Cancel
				</Button>
				<Button
					variant="secondary"
					onClick={() => {
						setSubmitImmediately(false);
						handleSubmit();
					}}
					disabled={!isValid || createRequisition.isPending}
				>
					Save as Draft
				</Button>
				<Button
					onClick={() => {
						setSubmitImmediately(true);
						handleSubmit();
					}}
					disabled={
						!isValid ||
						createRequisition.isPending ||
						submitRequisition.isPending
					}
				>
					{createRequisition.isPending || submitRequisition.isPending
						? "Submitting..."
						: "Submit for Approval"}
				</Button>
			</div>
		</div>
	);
}
