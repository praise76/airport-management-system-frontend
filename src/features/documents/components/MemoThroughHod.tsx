import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CornerUpLeft, Loader2, Send } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { hodReturnMemo, hodSendMemoOn, sendMemoThroughHod } from "@/api/documents";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/hooks/departments";
import { useAuthStore } from "@/stores/auth";

const notYet = (e: any, fallback: string) =>
	e?.status === 404 ? "Sending a memo through your HOD isn't available on the server yet." : e?.message || fallback;

/**
 * An officer writes to another department. The memo goes to the officer's own HOD first, who
 * sends it on to the other department's HOD or returns it.
 */
export function SendThroughHodDialog() {
	const ids = { to: useId(), subject: useId(), body: useId(), file: useId() };
	const qc = useQueryClient();
	const me = useAuthStore((s) => s.user);
	const { data } = useDepartments({ limit: 300 });
	const all: any[] = (data as any)?.data ?? data ?? [];
	// The officer's own top-level department (they may sit in one of its units) isn't a destination.
	let own = all.find((d) => d.id === me?.departmentId);
	while (own?.parentDepartmentId) own = all.find((d) => d.id === own.parentDepartmentId) ?? null;
	const departments = all.filter((d) => d.departmentLevel === 1 && !/registry/i.test(d.name) && d.id !== own?.id);
	const [open, setOpen] = useState(false);
	const [to, setTo] = useState("");
	const [subject, setSubject] = useState("");
	const [content, setContent] = useState("");
	const [file, setFile] = useState<File | undefined>();
	const reset = () => {
		setTo("");
		setSubject("");
		setContent("");
		setFile(undefined);
	};
	const send = useMutation({
		mutationFn: () => sendMemoThroughHod({ toDepartmentId: to, subject, content, file }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Sent to your HOD. They will send it on to the other department, or return it to you.");
			reset();
			setOpen(false);
		},
		onError: (e: any) => toast.error(notYet(e, "Couldn't send the memo.")),
	});
	const toName = departments.find((d: any) => d.id === to)?.name;
	return (
		<>
			<Button variant="secondary" onClick={() => setOpen(true)}>
				<Send className="mr-2 h-4 w-4" /> Send through my HOD
			</Button>
			<Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Send through my HOD</DialogTitle>
						<DialogDescription>
							Write to another department. Your Head of Department reads it first and sends it on to that department's HOD.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor={ids.to}>To department</Label>
							<Select value={to} onValueChange={setTo}>
								<SelectTrigger id={ids.to} className="w-full">
									<SelectValue placeholder="Choose the department" />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									{departments.map((d: any) => (
										<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.subject}>Subject</Label>
							<Input id={ids.subject} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.body}>Message</Label>
							<Textarea id={ids.body} rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor={ids.file}>Attachment (optional)</Label>
							<Input id={ids.file} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0])} />
						</div>
						{toName && <p className="text-xs text-muted-foreground">Route: you → your HOD → HOD, {toName}.</p>}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
						<Button disabled={send.isPending || !to || subject.trim().length < 3 || content.trim().length < 5} onClick={() => send.mutate()}>
							{send.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send to my HOD
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

/** On a memo waiting for the sender's HOD: send it on to the other department's HOD, or return it. */
export function HodMemoActions({ doc }: { doc: any }) {
	const ids = { minute: useId() };
	const qc = useQueryClient();
	const me = useAuthStore((s) => s.user);
	const myId = me?.userId ?? (me as any)?.id;
	const [minute, setMinute] = useState("");
	const waiting = doc?.status === "awaiting_hod" && (!doc.assignedToHodId || doc.assignedToHodId === myId || doc.currentHandlerUserId === myId);
	const done = () => {
		qc.invalidateQueries({ queryKey: ["documents"] });
		qc.invalidateQueries({ queryKey: ["document", doc.id] });
		setMinute("");
	};
	const on = useMutation({
		mutationFn: () => hodSendMemoOn(doc.id, minute.trim() || undefined),
		onSuccess: () => { done(); toast.success(`Sent on to the HOD of ${doc.finalDestinationName ?? "the other department"}.`); },
		onError: (e: any) => toast.error(notYet(e, "Couldn't send it on.")),
	});
	const back = useMutation({
		mutationFn: () => hodReturnMemo(doc.id, minute.trim()),
		onSuccess: () => { done(); toast.success("Returned to the sender."); },
		onError: (e: any) => toast.error(notYet(e, "Couldn't return it.")),
	});
	if (!waiting) return null;
	return (
		<section className="space-y-3 rounded-lg border bg-card p-4" aria-label="Memo waiting for you">
			<div>
				<h2 className="font-semibold">From your department, for {doc.finalDestinationName ?? "another department"}</h2>
				<p className="text-sm text-muted-foreground">Send it on to that department's HOD, or return it to the sender.</p>
			</div>
			<div className="space-y-1.5">
				<Label htmlFor={ids.minute}>Your minute</Label>
				<Textarea id={ids.minute} rows={3} value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="Optional when sending on; required when returning" />
			</div>
			<div className="flex flex-wrap gap-2">
				<Button disabled={on.isPending || back.isPending} onClick={() => on.mutate()}>
					{on.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
					Send to HOD, {doc.finalDestinationName ?? "the other department"}
				</Button>
				<Button variant="outline" disabled={on.isPending || back.isPending || minute.trim().length < 5} onClick={() => back.mutate()}>
					<CornerUpLeft className="mr-2 h-4 w-4" /> Return to sender
				</Button>
			</div>
		</section>
	);
}
