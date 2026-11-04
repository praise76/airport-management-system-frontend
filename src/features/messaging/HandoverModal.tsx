import { Loader2, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { useSendMessage } from "@/hooks/messaging";
import { cn } from "@/lib/utils";

interface HandoverModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	conversationId: string;
}

type EquipmentState = "OK" | "Faulty" | "Not in use";
const STATES: EquipmentState[] = ["OK", "Faulty", "Not in use"];

/** Usual kit at an AVSEC screening point. Staff can remove items or add their own. */
const DEFAULT_EQUIPMENT = [
	"X-ray machine",
	"Walk-through metal detector (WTMD)",
	"Hand-held metal detector (HHMD)",
	"Explosive trace detector (ETD)",
	"CCTV",
	"Radio",
];

const STORAGE_KEY = "handover-equipment";

/** Each channel remembers its own list, so a station only sets up its kit once. */
function loadList(conversationId: string): string[] {
	try {
		const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
		if (Array.isArray(all[conversationId])) return all[conversationId];
	} catch {
		/* storage unavailable */
	}
	return DEFAULT_EQUIPMENT;
}

function saveList(conversationId: string, items: string[]) {
	try {
		const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
		all[conversationId] = items;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
	} catch {
		/* storage unavailable */
	}
}

export function HandoverModal({
	open,
	onOpenChange,
	conversationId,
}: HandoverModalProps) {
	const sendMessageMutation = useSendMessage();
	const [status, setStatus] = useState("All Clear");
	const [passengers, setPassengers] = useState("");
	const [notes, setNotes] = useState("");
	const [urgent, setUrgent] = useState("");
	const [items, setItems] = useState<string[]>(() => loadList(conversationId));
	const [states, setStates] = useState<Record<string, EquipmentState>>({});
	const [newItem, setNewItem] = useState("");
	const fieldId = useId();
	const statusId = `${fieldId}-status`;
	const passengersId = `${fieldId}-passengers`;
	const urgentId = `${fieldId}-urgent`;
	const notesId = `${fieldId}-notes`;

	const setItemList = (next: string[]) => {
		setItems(next);
		saveList(conversationId, next);
	};

	const addItem = () => {
		const name = newItem.trim();
		if (!name || items.includes(name)) return;
		setItemList([...items, name]);
		setNewItem("");
	};

	const faulty = items.filter((i) => states[i] === "Faulty");
	const unchecked = items.filter((i) => !states[i]);

	const handleSubmit = async () => {
		if (unchecked.length) {
			toast.error(`Mark every item first: ${unchecked.join(", ")}`);
			return;
		}
		if (faulty.length && !urgent.trim() && !notes.trim()) {
			toast.error(
				"Say what's wrong with the faulty equipment in Urgent items or Notes.",
			);
			return;
		}
		const submittedStatus =
			faulty.length && status === "All Clear" ? "Issues Noted" : status;
		try {
			await sendMessageMutation.mutateAsync({
				conversationId,
				payload: {
					content: "🔄 Handover Report",
					messageType: "handover",
					metadata: {
						status: submittedStatus,
						passengers: passengers === "" ? undefined : Number(passengers),
						notes: notes.trim() || undefined,
						urgent: urgent.trim() || undefined,
						equipment: items.map((i) => `${i} - ${states[i]}`),
					},
				},
			});

			toast.success("Handover report sent to the channel");
			onOpenChange(false);
			setNotes("");
			setUrgent("");
			setPassengers("");
			setStates({});
			setStatus("All Clear");
		} catch (error: unknown) {
			toast.error(
				error instanceof Error
					? error.message
					: "The handover report wasn't sent. Please try again.",
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Handover report</DialogTitle>
					<DialogDescription>
						Posted to this channel so the next shift sees it when they arrive.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor={statusId}>Shift summary</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger id={statusId}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="All Clear" disabled={faulty.length > 0}>
										All clear
									</SelectItem>
									<SelectItem value="Issues Noted">Issues noted</SelectItem>
									<SelectItem value="Incident">Incident reported</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor={passengersId}>Passengers screened</Label>
							<Input
								id={passengersId}
								type="number"
								inputMode="numeric"
								value={passengers}
								onChange={(e) => setPassengers(e.target.value)}
								min={0}
								placeholder="e.g. 412"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Equipment check</Label>
						<div className="border rounded-md divide-y">
							{items.map((item) => (
								<div
									key={item}
									className="flex flex-wrap items-center gap-2 p-2"
								>
									<span className="flex-1 min-w-[140px] text-sm">{item}</span>
									<fieldset className="flex gap-1">
										<legend className="sr-only">{item}</legend>
										{STATES.map((s) => (
											<button
												key={s}
												type="button"
												aria-pressed={states[item] === s}
												onClick={() => {
													setStates((p) => ({ ...p, [item]: s }));
													// "All clear" with faulty kit would contradict itself.
													if (s === "Faulty" && status === "All Clear")
														setStatus("Issues Noted");
												}}
												className={cn(
													"rounded-full border px-2.5 py-1 text-xs",
													states[item] === s
														? s === "OK"
															? "border-emerald-600 bg-emerald-600 text-white"
															: s === "Faulty"
																? "border-red-600 bg-red-600 text-white"
																: "border-slate-500 bg-slate-500 text-white"
														: "hover:bg-muted",
												)}
											>
												{s}
											</button>
										))}
									</fieldset>
									<button
										type="button"
										title={`Remove ${item} from this station's list`}
										aria-label={`Remove ${item}`}
										onClick={() => setItemList(items.filter((i) => i !== item))}
										className="text-muted-foreground hover:text-foreground p-1"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
							))}
							<div className="flex gap-2 p-2">
								<Input
									value={newItem}
									onChange={(e) => setNewItem(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addItem();
										}
									}}
									placeholder="Add equipment, e.g. X-ray lane C"
									className="h-8"
								/>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={addItem}
								>
									<Plus className="h-4 w-4" /> Add
								</Button>
							</div>
						</div>
						<p className="text-xs text-muted-foreground">
							This channel remembers the list on this device.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor={urgentId}>Urgent items for the next shift</Label>
						<Textarea
							id={urgentId}
							value={urgent}
							onChange={(e) => setUrgent(e.target.value)}
							placeholder="Anything the next shift must act on straight away"
							className="border-red-200 focus-visible:ring-red-500"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={notesId}>Notes</Label>
						<Textarea
							id={notesId}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Anything else worth knowing"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={sendMessageMutation.isPending}
					>
						{sendMessageMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Send handover
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
