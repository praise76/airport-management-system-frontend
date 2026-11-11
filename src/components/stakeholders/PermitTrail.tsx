import {
	Check,
	CornerUpLeft,
	Forward,
	Inbox,
	MapPin,
	Send,
	UserCheck,
	X,
} from "lucide-react";
import { useItemTrail } from "@/hooks/stakeholder-portal";
import { AttachmentLink } from "./AttachmentPicker";
import { currentlyWith, fallbackTrail, STEP_LABEL } from "@/lib/routing";
import { cn } from "@/lib/utils";
import type {
	PermitTrailStep,
	RoutedKind,
	RoutingFields,
	TrailStepType,
} from "@/types/stakeholder-portal";

/**
 * Where a permit, activity or invoice is and where it has been.
 *
 * `surface="portal"` is the concessionaire portal (dark): office names and dates only.
 * `surface="staff"` is the staff app (light): also the minute, who acted and any named officer.
 */
type Surface = "portal" | "staff";

const ICON: Record<TrailStepType, typeof Check> = {
	submitted: Send,
	forwarded: Forward,
	returned: CornerUpLeft,
	assigned: UserCheck,
	acknowledged: Inbox,
	approved: Check,
	rejected: X,
};

const when = (iso: string) =>
	new Date(iso).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

function stepLine(step: PermitTrailStep): string {
	const office = step.toOffice;
	switch (step.stepType) {
		case "submitted":
			return office ? `Submitted to ${office}` : "Submitted";
		case "forwarded":
			return office ? `Forwarded to ${office}` : "Forwarded";
		case "returned":
			// A person handing it back to the head of their own office.
			if (office && step.fromOfficeId && step.fromOfficeId === step.toOfficeId)
				return `Returned to the head of ${office}`;
			return office ? `Returned to ${office}` : "Returned";
		case "assigned":
			return office ? `Assigned within ${office}` : "Assigned";
		case "acknowledged":
			return office ? `Received by ${office}` : "Received";
		default:
			return office
				? `${STEP_LABEL[step.stepType]} by ${office}`
				: STEP_LABEL[step.stepType];
	}
}

/** "Currently with: Airport Chief of Security, since 12 Nov 2026". Nothing if unknown. */
export function CurrentlyWith({
	item,
	surface,
	className,
}: {
	item: RoutingFields;
	surface: Surface;
	className?: string;
}) {
	const text = currentlyWith(item);
	if (!text) return null;
	return (
		<p
			className={cn(
				"flex items-center gap-1.5 text-sm",
				surface === "portal" ? "text-sky-200" : "text-foreground",
				className,
			)}
		>
			<MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
			{text}
		</p>
	);
}

/** The dated timeline, oldest first. */
export function PermitTrail({
	steps,
	surface,
	kind,
	itemId,
}: {
	steps: PermitTrailStep[];
	surface: Surface;
	/** With these, attached files open on click (staff only). */
	kind?: RoutedKind;
	itemId?: string;
}) {
	const portal = surface === "portal";
	if (steps.length === 0)
		return (
			<p
				className={cn(
					"text-sm",
					portal ? "text-slate-400" : "text-muted-foreground",
				)}
			>
				No movement recorded yet.
			</p>
		);
	return (
		<ol className="space-y-0" aria-label="Timeline">
			{steps.map((step, i) => {
				const Icon = ICON[step.stepType];
				const last = i === steps.length - 1;
				const tone =
					step.stepType === "approved"
						? portal
							? "border-emerald-400 text-emerald-300"
							: "border-green-600 text-green-700"
						: step.stepType === "rejected"
							? portal
								? "border-red-400 text-red-300"
								: "border-red-600 text-red-700"
							: last
								? portal
									? "border-sky-400 text-sky-300"
									: "border-primary text-primary"
								: portal
									? "border-slate-600 text-slate-400"
									: "border-border text-muted-foreground";
				return (
					<li
						key={`${step.stepNumber}-${step.at}`}
						className="relative flex gap-3 pb-5 last:pb-0"
					>
						{!last && (
							<span
								aria-hidden
								className={cn(
									"absolute left-[13px] top-7 bottom-0 w-px",
									portal ? "bg-slate-700" : "bg-border",
								)}
							/>
						)}
						<span
							className={cn(
								"z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
								portal ? "bg-slate-900" : "bg-background",
								tone,
							)}
						>
							<Icon className="h-3.5 w-3.5" aria-hidden />
						</span>
						<div className="min-w-0 pt-0.5">
							<p
								className={cn(
									"text-sm font-medium",
									portal ? "text-white" : "text-foreground",
								)}
							>
								{stepLine(step)}
							</p>
							<p
								className={cn(
									"text-xs",
									portal ? "text-slate-400" : "text-muted-foreground",
								)}
							>
								{when(step.at)}
								{!portal && step.actorName && ` · ${step.actorName}`}
								{!portal &&
									step.toOfficerName &&
									` · for ${step.toOfficerName}`}
							</p>
							{!portal && step.minute && (
								<p className="mt-1.5 rounded-md bg-muted/50 p-2 text-sm">
									{step.minute}
								</p>
							)}
							{!portal && !!step.attachments?.length && (
								<ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Attached files">
									{step.attachments.map((file) => (
										<li key={file.id}>
											<AttachmentLink kind={kind} itemId={itemId} attachment={file} />
										</li>
									))}
								</ul>
							)}
						</div>
					</li>
				);
			})}
		</ol>
	);
}

/**
 * Loads and shows the trail for one item. Until the server records movements, it shows what is
 * known from the record itself: "Submitted" and the decision.
 */
export function TrailSection({
	kind,
	item,
	surface,
}: {
	kind: RoutedKind;
	item: {
		id: string;
		createdAt: string;
		status: string;
		submittedAt?: string;
		approvedAt?: string;
		reviewedAt?: string;
	} & RoutingFields;
	surface: Surface;
}) {
	const { data, isLoading, isError } = useItemTrail(kind, item.id);
	const portal = surface === "portal";
	if (isLoading)
		return (
			<p
				className={cn(
					"text-sm",
					portal ? "text-slate-400" : "text-muted-foreground",
				)}
			>
				Loading timeline…
			</p>
		);
	if (isError)
		return (
			<p
				role="alert"
				className={cn("text-sm", portal ? "text-red-300" : "text-destructive")}
			>
				Couldn't load the timeline. Close this and open it again.
			</p>
		);
	const steps = data && data.length > 0 ? data : fallbackTrail(item);
	return <PermitTrail steps={steps} surface={surface} kind={kind} itemId={item.id} />;
}
