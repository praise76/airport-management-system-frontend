import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
	ArrowLeft,
	CheckCircle2,
	CornerUpLeft,
	ExternalLink,
	Loader2,
	Send,
	UserPlus,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { fileUrl } from "@/api/client";
import { DepartmentSelector } from "@/components/departments";
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
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { DocumentJourney } from "@/features/documents/components/DocumentJourney";
import {
	useAcknowledgeDocument,
	useApproveDocument,
	useDocument,
	useDocumentJourney,
	useForwardDocument,
	useRejectDocument,
	useReturnDocument,
	useRgmForwardDocument,
} from "@/hooks/documents";
import { useUsers } from "@/hooks/users";
import { hasAnyRole, ROLE_GROUPS } from "@/lib/access";
import { label } from "@/lib/labels";
import { useAuthStore } from "@/stores/auth";

// Sign-in is checked for every page in __root.tsx.
export const Route = createFileRoute("/documents/$docId")({
	component: DocumentDetailsPage,
});

const fmtDate = (d?: string) => (d ? format(new Date(d), "d MMM yyyy") : undefined);

function DocumentDetailsPage() {
	const { docId } = Route.useParams();
	const user = useAuthStore((s) => s.user);
	const isValid = !!docId && !["new", "undefined", "null"].includes(docId) && docId.length > 5;

	const details = useDocument(docId);
	const journey = useDocumentJourney(docId);

	if (!isValid) {
		return <p className="py-12 text-center text-muted-foreground">This document link isn't valid.</p>;
	}
	if (details.isLoading && journey.isLoading) {
		return <p className="py-12 text-center text-muted-foreground">Loading document…</p>;
	}
	if (details.isError && journey.isError) {
		return (
			<p className="py-12 text-center text-destructive">
				Couldn't load this document. It may have been removed, or you may not have access.
			</p>
		);
	}

	const doc = details.data;
	const isManager = hasAnyRole(user, ROLE_GROUPS.management);
	const isSupervisor = hasAnyRole(user, ROLE_GROUPS.supervisors);
	const isRgm = hasAnyRole(user, ["RGM", ...ROLE_GROUPS.admins]);
	const link = fileUrl(doc?.fileUrl);
	const deadline = doc?.responseDeadline ? new Date(doc.responseDeadline) : null;
	const overdue = deadline && deadline < new Date() && !/closed|approved|rejected/i.test(doc?.status ?? "");

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex items-start gap-3 min-w-0">
					<Link to="/documents" className="mt-1 text-muted-foreground hover:text-foreground" aria-label="Back to documents">
						<ArrowLeft className="h-5 w-5" />
					</Link>
					<div className="min-w-0">
						<p className="font-mono text-sm text-muted-foreground">
							{doc?.registryNumber || journey.data?.registryNumber}
						</p>
						<h1 className="text-xl md:text-2xl font-semibold break-words">
							{doc?.subject ?? "Document"}
						</h1>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							{doc?.status && <StatusPill status={doc.status} />}
							{doc?.priority && doc.priority !== "normal" && <StatusPill status={`${doc.priority}_priority`} />}
							{deadline && (
								<span className={`text-sm ${overdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
									{overdue ? "Overdue: " : "Due "}
									{format(deadline, "d MMM yyyy")}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
				{/* The document itself */}
				<div className="space-y-4">
					<div className="rounded-lg border bg-card overflow-hidden">
						{link ? (
							<>
								{/\.(png|jpe?g|gif|webp)$/i.test(link) ? (
									<img src={link} alt={doc?.subject ?? "Document"} className="w-full max-h-[70vh] object-contain bg-muted" />
								) : /\.pdf($|\?)/i.test(link) ? (
									<iframe src={link} title={doc?.subject ?? "Document"} className="w-full h-[70vh] bg-muted" />
								) : (
									<p className="p-6 text-sm text-muted-foreground">This file type can't be previewed here.</p>
								)}
								<div className="border-t p-2 text-right">
									<a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
										Open file in a new tab <ExternalLink className="h-3.5 w-3.5" />
									</a>
								</div>
							</>
						) : (
							<p className="p-6 text-sm text-muted-foreground">No file was attached when this document was registered.</p>
						)}
					</div>

					<dl className="rounded-lg border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
						<Detail term="Direction" value={label(doc?.direction)} />
						<Detail term="Type" value={label(doc?.documentType)} />
						<Detail term="From" value={[doc?.senderName, doc?.senderOrganization].filter(Boolean).join(", ")} />
						<Detail term="Their reference" value={doc?.senderReference} />
						<Detail term="Date on letter" value={fmtDate(doc?.dateReceived)} />
						<Detail term="Registered" value={doc?.createdAt ? format(new Date(doc.createdAt), "d MMM yyyy, HH:mm") : undefined} />
						<Detail term="Stage" value={label(doc?.workflowStage)} />
						<Detail term="Terminal" value={doc?.terminalCode} />
					</dl>
				</div>

				{/* What to do next, and where it has been */}
				<div className="space-y-6">
					<div className="rounded-lg border bg-card p-4 space-y-3">
						<h2 className="font-semibold">Take action</h2>
						<div className="flex flex-wrap gap-2">
							<ForwardToPersonDialog docId={docId} />
							{isRgm && <ForwardToDeptDialog docId={docId} />}
							{isSupervisor && <ReturnDialog docId={docId} />}
							{isSupervisor && <AcknowledgeDialog docId={docId} />}
							{isManager && <DecisionDialogs docId={docId} />}
						</div>
						<p className="text-xs text-muted-foreground">
							Your minute (comment) is saved with each action and shown in the timeline.
						</p>
					</div>

					<div className="rounded-lg border bg-card p-4">
						<h2 className="font-semibold mb-3">Timeline</h2>
						{journey.data?.journey?.length ? (
							<DocumentJourney steps={journey.data.journey} />
						) : (
							<p className="text-sm text-muted-foreground">No movements recorded yet.</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function Detail({ term, value }: { term: string; value?: string }) {
	return (
		<div>
			<dt className="text-xs uppercase tracking-wide text-muted-foreground">{term}</dt>
			<dd className="mt-0.5">{value || <span className="text-muted-foreground">Not recorded</span>}</dd>
		</div>
	);
}

/** Shared shell: a button that opens a dialog with a minute box and an optional extra field. */
function ActionDialog({
	trigger,
	title,
	description,
	confirmLabel,
	busy,
	requireMinute,
	destructive,
	extra,
	canSubmit = true,
	onSubmit,
}: {
	trigger: React.ReactNode;
	title: string;
	description?: string;
	confirmLabel: string;
	busy: boolean;
	requireMinute?: boolean;
	destructive?: boolean;
	extra?: React.ReactNode;
	canSubmit?: boolean;
	onSubmit: (minute: string, close: () => void) => void;
}) {
	const [open, setOpen] = useState(false);
	const [minute, setMinute] = useState("");
	const close = () => {
		setOpen(false);
		setMinute("");
	};
	return (
		<>
			<span onClick={() => setOpen(true)}>{trigger}</span>
			<Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && <DialogDescription>{description}</DialogDescription>}
					</DialogHeader>
					<div className="space-y-4">
						{extra}
						<div className="space-y-2">
							<Label htmlFor="minute">Minute{requireMinute ? "" : " (optional)"}</Label>
							<Textarea id="minute" rows={4} value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="e.g. AVSEC to treat urgently and brief me" />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={close}>Cancel</Button>
						<Button
							variant={destructive ? "destructive" : "default"}
							disabled={busy || !canSubmit || (requireMinute && minute.trim().length < 3)}
							onClick={() => onSubmit(minute.trim(), close)}
						>
							{busy && <Loader2 className="h-4 w-4 animate-spin" />}
							{confirmLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function ForwardToPersonDialog({ docId }: { docId: string }) {
	const forward = useForwardDocument(docId);
	const { data } = useUsers({ limit: 500 });
	const [toUserId, setToUserId] = useState("");
	const [deadline, setDeadline] = useState("");
	const [q, setQ] = useState("");
	const people = useMemo(() => {
		const all = (data?.data ?? []) as any[];
		const needle = q.trim().toLowerCase();
		return needle
			? all.filter((u) => `${u.firstName} ${u.lastName} ${u.email ?? ""}`.toLowerCase().includes(needle))
			: all;
	}, [data, q]);
	return (
		<ActionDialog
			trigger={<Button size="sm"><UserPlus className="h-4 w-4" /> Assign to officer</Button>}
			title="Assign to an officer"
			description="The officer will see it under My Assignments."
			confirmLabel="Assign"
			busy={forward.isPending}
			canSubmit={!!toUserId}
			extra={
				<>
					<div className="space-y-2">
						<Label>Officer</Label>
						<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" />
						<Select value={toUserId} onValueChange={setToUserId}>
							<SelectTrigger><SelectValue placeholder="Choose an officer" /></SelectTrigger>
							<SelectContent>
								{people.slice(0, 100).map((u: any) => (
									<SelectItem key={u.id} value={u.id}>
										{u.firstName} {u.lastName}
										{u.department?.name ? ` · ${u.department.name}` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="fwd-deadline">Act by (optional)</Label>
						<Input id="fwd-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
					</div>
				</>
			}
			onSubmit={(minute, close) =>
				forward.mutate(
					{
						toUserId,
						comments: minute || undefined,
						deadline: deadline ? new Date(`${deadline}T17:00:00`).toISOString() : undefined,
					},
					{ onSuccess: () => { setToUserId(""); setDeadline(""); close(); } },
				)
			}
		/>
	);
}

function ForwardToDeptDialog({ docId }: { docId: string }) {
	const forward = useRgmForwardDocument(docId);
	const [dept, setDept] = useState("");
	return (
		<ActionDialog
			trigger={<Button size="sm" variant="outline"><Send className="h-4 w-4" /> Forward to department</Button>}
			title="Forward to a department"
			confirmLabel="Forward"
			busy={forward.isPending}
			canSubmit={!!dept}
			extra={
				<div className="space-y-2">
					<Label>Department</Label>
					<DepartmentSelector value={dept} onChange={(v) => setDept(v ?? "")} placeholder="Select department" filterLevel={1} />
				</div>
			}
			onSubmit={(minute, close) =>
				forward.mutate({ targetDeptId: dept, comments: minute || undefined }, { onSuccess: () => { setDept(""); close(); } })
			}
		/>
	);
}

function ReturnDialog({ docId }: { docId: string }) {
	const ret = useReturnDocument(docId);
	return (
		<ActionDialog
			trigger={<Button size="sm" variant="outline"><CornerUpLeft className="h-4 w-4" /> Return</Button>}
			title="Return to the previous desk"
			description="Say what needs to be corrected or added."
			confirmLabel="Return"
			requireMinute
			busy={ret.isPending}
			onSubmit={(minute, close) => ret.mutate({ comments: minute }, { onSuccess: close })}
		/>
	);
}

function AcknowledgeDialog({ docId }: { docId: string }) {
	const ack = useAcknowledgeDocument(docId);
	return (
		<ActionDialog
			trigger={<Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4" /> Acknowledge receipt</Button>}
			title="Acknowledge receipt"
			confirmLabel="Acknowledge"
			busy={ack.isPending}
			onSubmit={(minute, close) => ack.mutate({ notes: minute || undefined }, { onSuccess: close })}
		/>
	);
}

function DecisionDialogs({ docId }: { docId: string }) {
	const approve = useApproveDocument(docId);
	const reject = useRejectDocument(docId);
	return (
		<>
			<ActionDialog
				trigger={<Button size="sm"><CheckCircle2 className="h-4 w-4" /> Approve</Button>}
				title="Approve"
				confirmLabel="Approve"
				busy={approve.isPending}
				onSubmit={(minute, close) => approve.mutate({ comments: minute || undefined }, { onSuccess: close })}
			/>
			<ActionDialog
				trigger={<Button size="sm" variant="outline"><XCircle className="h-4 w-4" /> Reject</Button>}
				title="Reject"
				description="Give the reason. It's recorded in the timeline."
				confirmLabel="Reject"
				requireMinute
				destructive
				busy={reject.isPending}
				onSubmit={(minute, close) => reject.mutate({ comments: minute }, { onSuccess: close })}
			/>
		</>
	);
}
