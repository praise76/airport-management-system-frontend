import { BadgeCheck, Check, Loader2, Send, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePositions } from "@/hooks/positions";
import { useForwardItem, useItemTrail } from "@/hooks/stakeholder-portal";
import { authorityOffices, permitStage } from "@/lib/permitAuthority";
import { holdsItem } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth";
import type {
	RoutingFields,
	TrailAttachment,
} from "@/types/stakeholder-portal";
import { AttachmentPicker } from "./AttachmentPicker";
import { ReasonDialog } from "./ReviewActions";

type Permit = {
	id: string;
	status: string;
	permitType?: string;
	rgmApprovedAt?: string;
	currentOfficeType?: string;
	sponsorDepartmentId?: string | null;
	sponsorDepartmentName?: string | null;
	introducedAt?: string | null;
} & RoutingFields;

/**
 * The decision buttons on an access permit. Only the RGM approves and only ACOS issues. A
 * contractor's permit waits at the RGM for its HOD's letter of introduction.
 */
export function PermitDecision({
	permit,
	name,
	held,
	busy,
	onIssue,
	onReject,
}: {
	permit: Permit;
	name: string;
	/** The server has said the user's office holds it ("With my office"). */
	held?: boolean;
	busy?: boolean;
	onIssue: () => void;
	onReject: (reason: string) => void;
}) {
	const user = useAuthStore((s) => s.user);
	const { data: positions } = usePositions();
	const offices = authorityOffices(positions ?? []);
	const mayAct = held ?? holdsItem(user, permit);
	const atAcos = !!offices.acos && permit.currentOfficeId === offices.acos.id;
	const trail = useItemTrail("permits", permit.id, mayAct && atAcos);
	const stage = permitStage(permit, offices, trail.data ?? []);
	const forward = useForwardItem("permits");
	const [dialog, setDialog] = useState<"reject" | "approve" | "to_rgm" | null>(
		null,
	);
	if (!mayAct || stage === "decided" || stage === "elsewhere") return null;

	const send = (
		to: { id: string } | undefined,
		minute: string,
		attachments?: string[],
	) =>
		to &&
		forward.mutate(
			{
				id: permit.id,
				input: {
					toOfficeId: to.id,
					toOfficeType: "position",
					minute,
					attachments,
				},
			},
			{ onSuccess: () => setDialog(null) },
		);
	const working = busy || forward.isPending;

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{stage === "with_rgm" && (
					<>
						<Button
							size="sm"
							variant="outline"
							disabled={working}
							onClick={() => setDialog("reject")}
						>
							<X className="h-4 w-4" /> Reject
						</Button>
						<Button
							size="sm"
							disabled={working || !offices.acos}
							onClick={() => setDialog("approve")}
						>
							<Check className="h-4 w-4" /> Approve and send to ACOS
						</Button>
					</>
				)}
				{stage === "with_acos_ready" && (
					<>
						<Button
							size="sm"
							variant="outline"
							disabled={working}
							onClick={() => setDialog("reject")}
						>
							<X className="h-4 w-4" /> Reject
						</Button>
						<Button size="sm" disabled={working} onClick={onIssue}>
							{working ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<BadgeCheck className="h-4 w-4" />
							)}{" "}
							Issue permit
						</Button>
					</>
				)}
				{stage === "with_acos_waiting" && (
					<>
						<span className="self-center text-xs text-muted-foreground">
							Needs the RGM's approval before it can be issued.
						</span>
						<Button
							size="sm"
							variant="outline"
							disabled={working || !offices.rgm}
							onClick={() => setDialog("to_rgm")}
						>
							<Send className="h-4 w-4" /> Send to the RGM
						</Button>
					</>
				)}
				{stage === "with_rgm_waiting_hod" && (
					<>
						<span className="self-center text-xs text-muted-foreground">
							Waiting for the letter of introduction from{" "}
							{permit.sponsorDepartmentName ?? "the contractor's HOD"}.
						</span>
						<Button
							size="sm"
							variant="outline"
							disabled={working}
							onClick={() => setDialog("reject")}
						>
							<X className="h-4 w-4" /> Reject
						</Button>
					</>
				)}
			</div>
			<ReasonDialog
				open={dialog === "reject"}
				onOpenChange={(o) => !o && setDialog(null)}
				title={`Reject ${name}?`}
				confirmLabel="Reject"
				busy={working}
				onConfirm={(reason) => {
					onReject(reason);
					setDialog(null);
				}}
			/>
			<MinuteDialog
				open={dialog === "approve" || dialog === "to_rgm"}
				onOpenChange={(o) => !o && setDialog(null)}
				title={
					dialog === "approve" ? `Approve ${name}` : `Send ${name} to the RGM`
				}
				description={
					dialog === "approve"
						? "It goes to the Airport Chief of Security to issue. The company sees that it is with ACOS."
						: "The RGM must approve it before ACOS can issue it."
				}
				defaultMinute={
					dialog === "approve"
						? "Approved by the RGM. For issue, please."
						: "For the RGM's approval, please."
				}
				confirmLabel={dialog === "approve" ? "Approve and send" : "Send"}
				busy={working}
				onConfirm={(m) =>
					send(dialog === "approve" ? offices.acos : offices.rgm, m)
				}
			/>
		</>
	);
}

function MinuteDialog({
	open,
	onOpenChange,
	title,
	description,
	defaultMinute,
	confirmLabel,
	busy,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	title: string;
	description: string;
	defaultMinute: string;
	confirmLabel: string;
	busy?: boolean;
	onConfirm: (minute: string) => void;
}) {
	const id = useId();
	const [minute, setMinute] = useState("");
	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) setMinute("");
				onOpenChange(o);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="space-y-1.5">
					<Label htmlFor={id}>Minute</Label>
					<Textarea
						id={id}
						rows={3}
						value={minute}
						placeholder={defaultMinute}
						onChange={(e) => setMinute(e.target.value)}
					/>
					<p className="text-xs text-muted-foreground">
						Staff only. Leave blank to use the text shown.
					</p>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={busy}
						onClick={() => onConfirm(minute.trim() || defaultMinute)}
					>
						{busy && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** The sponsoring HOD confirms a contractor by sending a letter of introduction. */
export function IntroduceDialog({
	open,
	onOpenChange,
	permitId,
	name,
	busy,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	permitId: string;
	name: string;
	busy?: boolean;
	onConfirm: (note: string, files: string[]) => void;
}) {
	const id = useId();
	const [minute, setMinute] = useState("");
	const [files, setFiles] = useState<TrailAttachment[]>([]);
	const fallback =
		"We confirm this contractor is working for our department. Letter of introduction attached.";
	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					setMinute("");
					setFiles([]);
				}
				onOpenChange(o);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirm {name}</DialogTitle>
					<DialogDescription>
						Attach your letter of introduction for this contractor. The RGM can
						approve the permit once it is in; ACOS then issues it.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<p className="text-sm font-medium">Letter of introduction</p>
						<AttachmentPicker
							kind="permits"
							itemId={permitId}
							value={files}
							onChange={setFiles}
						/>
						{files.length === 0 && (
							<p className="text-xs text-muted-foreground">Required.</p>
						)}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor={id}>Note to the RGM and ACOS</Label>
						<Textarea
							id={id}
							rows={3}
							value={minute}
							placeholder={fallback}
							onChange={(e) => setMinute(e.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={busy || files.length === 0}
						onClick={() =>
							onConfirm(
								minute.trim() || fallback,
								files.map((f) => f.id),
							)
						}
					>
						{busy && <Loader2 className="h-4 w-4 animate-spin" />} Send letter
						of introduction
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
